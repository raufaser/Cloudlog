/*
 * QSL card receive panel: live callsign filter, Shift+Enter marks everything
 * shown as received, per-row buttons handle cards that confirm only some QSOs.
 */
var searchTimer = null;
var rowsData = {};       // qsoID -> row from the search endpoint
var lastUndo = null;     // {ids: [...], values: {...}} for the one-step undo

// Ensure CSRF token is included in all POST requests
if (typeof CSRF_NAME !== 'undefined' && typeof CSRF_HASH !== 'undefined') {
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (settings.type === 'POST') {
                if (typeof settings.data === 'string') {
                    settings.data += '&' + encodeURIComponent(CSRF_NAME) + '=' + encodeURIComponent(CSRF_HASH);
                } else if (typeof settings.data === 'object') {
                    settings.data[CSRF_NAME] = CSRF_HASH;
                }
            }
        }
    });
}

$(document).ready(function () {
	$('#callsign').trigger('focus');

	$('#callsign').on('input', function () {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(loadQsos, 200);
	});

	// Shift+Enter marks the list. Plain Enter never writes: search is already
	// live, and Enter after typing in a search field is pure reflex.
	$('#callsign').on('keydown', function (e) {
		if (e.keyCode === 13 && e.shiftKey) {
			e.preventDefault();
			markAllReceived();
		}
		if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			undoLast();
		}
	});

	$('#undo').click(function () {
		undoLast();
	});

	$('#qsoTable').on('click', '.btn-received', function () {
		var id = String($(this).data('id'));
		if (rowsData[id] && rowsData[id].qslReceived === 'Y') {
			return; // double confirmed stays confirmed
		}
		postAction('logbookadvanced/update_qsl_received', [id], {
			'sent': 'Y',
			'method': $('#method').val()
		}, [id]);
	});

	$('#qsoTable').on('click', '.btn-sent', function () {
		var id = String($(this).data('id'));
		if ($(this).prop('disabled')) {
			return;
		}
		postAction('logbookadvanced/update_qsl', [id], {
			'sent': 'R',
			'method': $('#method').val()
		}, [id]);
	});
});

function loadQsos() {
	$('#qslStatus').text('Searching...');

	$.ajax({
		url: base_url + 'index.php/logbookadvanced/search',
		type: 'post',
		data: {
			dateFrom: '', dateTo: '', de: '', dx: $('#callsign').val().trim(),
			mode: '', band: '', qslSent: '', qslReceived: '', qslSentMethod: '',
			qslReceivedMethod: '', iota: '', operator: '', dxcc: '', propmode: '',
			gridsquare: '', state: '', qsoresults: 100, sats: '', cqzone: '',
			lotwSent: '', lotwReceived: '', eqslSent: '', eqslReceived: '',
			qslvia: '', sota: '', pota: '', wwff: '', qslimages: '', dupes: ''
		},
		dataType: 'json',
		success: function (data) {
			rowsData = {};
			$.each(data, function (i, qso) {
				rowsData[String(qso.qsoID)] = qso;
			});
			renderRows(data);
		},
		error: function () {
			$('#qslStatus').text('Search failed');
		}
	});
}

function renderRows(rows) {
	var body = $('#qsoTable tbody');
	body.empty();

	var pending = 0;
	$.each(rows, function (i, qso) {
		if (qso.qslReceived !== 'Y') {
			pending++;
		}
		var rcvdLabel = receivedLabel(qso.qslReceived);
		var sentLabel = receivedLabel(qso.qslSent);

		var tr = '<tr>'
			+ '<td>' + escapeHtml(qso.dx) + '</td>'
			+ '<td>' + escapeHtml(qso.band) + '</td>'
			+ '<td>' + escapeHtml(qso.mode) + '</td>'
			+ '<td>' + escapeHtml(qso.qsoDateTime) + '</td>'
			+ '<td><button type="button" class="btn btn-sm ' + (qso.qslReceived === 'Y' ? 'btn-success' : 'btn-outline-success') + ' btn-received" data-id="' + qso.qsoID + '"' + (qso.qslReceived === 'Y' ? ' disabled' : '') + '>' + rcvdLabel + '</button></td>'
			+ '<td><button type="button" class="btn btn-sm ' + (qso.qslSent === 'R' ? 'btn-warning' : qso.qslSent === 'Y' ? 'btn-success' : 'btn-outline-warning') + ' btn-sent" data-id="' + qso.qsoID + '"' + ((qso.qslSent === 'R' || qso.qslSent === 'Y') ? ' disabled' : '') + '>' + sentLabel + '</button></td>'
			+ '</tr>';
		body.append(tr);
	});

	$('#qslStatus').text(rows.length + ' QSOs shown' + (pending ? ' · ' + pending + ' not confirmed yet' : ''));
}

function receivedLabel(state) {
	switch (state) {
		case 'Y': return 'Y';
		case 'R': return 'R';
		case 'Q': return 'Q';
		case 'I': return 'I';
		case 'N': return 'N';
		default: return '-';
	}
}

function escapeHtml(text) {
	return $('<div>').text(text ?? '').html();
}

function snapshot(ids) {
	var values = {};
	$.each(ids, function (i, id) {
		var qso = rowsData[String(id)];
		if (qso) {
			values[id] = {
				rcvd: qso.qslReceived,
				rcvdVia: qso.qslReceivedVia,
				rcvdDate: qso.qslReceivedDate,
				sent: qso.qslSent,
				sentVia: qso.qslSentVia,
				sentDate: qso.qslSentDate
			};
		}
	});
	return values;
}

function postAction(url, ids, extra, undoIds) {
	$.ajax({
		url: base_url + 'index.php/' + url,
		type: 'post',
		data: $.extend({ id: JSON.stringify(ids) }, extra),
		success: function () {
			lastUndo = { ids: undoIds, values: snapshot(undoIds) };
			$('#undo').prop('disabled', false);
			$('#callsign').val('').trigger('focus');
			loadQsos();
		}
	});
}

function markAllReceived() {
	var ids = [];
	$.each(rowsData, function (id, qso) {
		if (qso.qslReceived !== 'Y') {
			ids.push(id);
		}
	});
	if (ids.length === 0) {
		return;
	}
	postAction('logbookadvanced/update_qsl_received', ids, {
		'sent': 'Y',
		'method': $('#method').val()
	}, ids);
}

function undoLast() {
	if (!lastUndo) {
		return;
	}
	$.ajax({
		url: base_url + 'index.php/logbookadvanced/revert_qsl',
		type: 'post',
		data: {
			id: JSON.stringify(lastUndo.ids),
			values: JSON.stringify(lastUndo.values)
		},
		success: function () {
			lastUndo = null;
			$('#undo').prop('disabled', true);
			loadQsos();
		}
	});
}
