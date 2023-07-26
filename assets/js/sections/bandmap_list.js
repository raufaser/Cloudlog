$(function() {

	function SortByQrg(a, b){
		var a = a.frequency;
		var b = b.frequency;
		return ((a< b) ? -1 : ((a> b) ? 1 : 0));
	}

	function get_dtable () {
		var table = $('.spottable').DataTable({
			"retrieve":true,
			'columnDefs': [
				{
					'targets': 1, "type":"num",
					'createdCell':  function (td, cellData, rowData, row, col) {
						$(td).addClass("kHz"); 
					}
				}
			]
		});
		return table;
	}

	function fill_list(band,de,maxAgeMinutes) {
		// var table = $('.spottable').DataTable();
		var table = get_dtable();
		if ((band != '') && (band !== undefined)) {
			let dxurl = dxcluster_provider + "/spots/" + band + "/" +maxAgeMinutes + "/" + de;
			$.ajax({
				url: dxurl,
				cache: false,
				dataType: "json"
			}).done(function(dxspots) {
				table.page.len(50);
				let oldtable=table.data();
				table.clear();
				if (dxspots.length>0) {
					dxspots.sort(SortByQrg);
					dxspots.forEach((single) => {
						var data=[];
						data[0]=[];
						data[0].push(single.when_pretty);
						data[0].push(single.frequency*1);
						data[0].push((single.worked_call ?'<span class="text-success">' : '')+single.spotted+(single.worked_call ? '</span>' : ''));
						data[0].push(single.dxcc_spotted.entity);
						data[0].push(single.spotter);
						if (oldtable.length > 0) {
							let update=false;
							oldtable.each( function (srow) {
								if (JSON.stringify(srow) === JSON.stringify(data[0])) {
									update=true;
								} 
							});
							if (!update) { 	// Sth. Fresh? So highlight
								table.rows.add(data).draw().nodes().to$().addClass("fresh bg-info"); 
							} else { 
								table.rows.add(data).draw(); 
							}
						} else {
							table.rows.add(data).draw();
						}
					});
					setTimeout(function(){	// Remove Highlights within 15sec
						$(".fresh").removeClass("bg-info");
					},1000);
				}
			});
		} else {
			table.clear();
			table.draw();
		}
	}

	function highlight_current_qrg(qrg) {
		var table=get_dtable();
		// var table=$('.spottable').DataTable();
		table.rows().every(function() {
			var d=this.data();
			var distance=Math.abs(parseInt(d[1].substring(0,d[1].length-4))-qrg);
			if (distance<=20) {
				distance++;
				alpha=(.5/distance);
				this.nodes().to$().css('background-color', 'rgba(0,0,255,' + alpha + ')');
			} else {
				this.nodes().to$().css('background-color', '');
			}
		});
	}

	var table=get_dtable();
	table.order([1, 'asc']);
	table.clear();
	fill_list($('#band option:selected').val(), $('#decontSelect option:selected').val(),dxcluster_maxage);
	setInterval(function () { fill_list($('#band option:selected').val(), $('#decontSelect option:selected').val(),dxcluster_maxage); },60000);

	$("#decontSelect").on("change",function() {
		table.clear();
		fill_list($('#band option:selected').val(), $('#decontSelect option:selected').val(),dxcluster_maxage);
	});

	$("#band").on("change",function() {
		table.order([1, 'asc']);
		table.clear();
		fill_list($('#band option:selected').val(), $('#decontSelect option:selected').val(),dxcluster_maxage);
	});

	$("#spottertoggle").on("click", function() {
		if (table.column(4).visible()) {
			table.column(4).visible(false);
		} else {
			table.column(4).visible(true);
		}
	});

	$("#menutoggle").on("click", function() {
		if ($('.navbar').is(":hidden")) {
			$('.navbar').show();
			$('#dxtabs').show();
			$('#dxtitle').show();
			$('#menutoggle_i').removeClass('fa-arrow-down');
			$('#menutoggle_i').addClass('fa-arrow-up');
		} else {
			$('.navbar').hide();
			$('#dxtabs').hide();
			$('#dxtitle').hide();
			$('#menutoggle_i').removeClass('fa-arrow-up');
			$('#menutoggle_i').addClass('fa-arrow-down');
		}
	});
	
	var updateFromCAT = function() {
	if($('select.radios option:selected').val() != '0') {
		radioID = $('select.radios option:selected').val();
		$.getJSON( base_url+"radio/json/" + radioID, function( data ) {

			if (data.error) {
				if (data.error == 'not_logged_in') {
					$(".radio_cat_state" ).remove();
					if($('.radio_login_error').length == 0) {
						$('.messages').prepend('<div class="alert alert-danger radio_login_error" role="alert"><i class="fas fa-broadcast-tower"></i> You\'re not logged it. Please <a href="'+base_url+'">login</a></div>');
					}
				}
				// Put future Errorhandling here
			} else {
				if($('.radio_login_error').length != 0) {
					$(".radio_login_error" ).remove();
				}
				var band = frequencyToBand(data.frequency);

				if (band !== $("#band").val()) {
					$("#band").val(band);
					$("#band").trigger("change");
				}

				var minutes = Math.floor(cat_timeout_interval / 60);

				if(data.updated_minutes_ago > minutes) {
					$(".radio_cat_state" ).remove();
					if($('.radio_timeout_error').length == 0) {
						$('.messages').prepend('<div class="alert alert-danger radio_timeout_error" role="alert"><i class="fas fa-broadcast-tower"></i> Radio connection timed-out: ' + $('select.radios option:selected').text() + ' data is ' + data.updated_minutes_ago + ' minutes old.</div>');
					} else {
						$('.radio_timeout_error').html('Radio connection timed-out: ' + $('select.radios option:selected').text() + ' data is ' + data.updated_minutes_ago + ' minutes old.');
					}
				} else {
					$(".radio_timeout_error" ).remove();
					text = '<i class="fas fa-broadcast-tower"></i><span style="margin-left:10px;"></span><b>TX:</b> '+(Math.round(parseInt(data.frequency)/100)/10000).toFixed(4)+' MHz';
					highlight_current_qrg((parseInt(data.frequency))/1000);
					if(data.mode != null) {
						text = text+'<span style="margin-left:10px"></span>'+data.mode;
					}
					if(data.power != null && data.power != 0) {
						text = text+'<span style="margin-left:10px"></span>'+data.power+' W';
					}
					if (! $('#radio_cat_state').length) {
						$('.messages').prepend('<div aria-hidden="true"><div id="radio_cat_state" class="alert alert-success radio_cat_state" role="alert">'+text+'</div></div>');
					} else {
						$('#radio_cat_state').html(text);
					}
				}
			}
		});
	}
};

$.fn.dataTable.moment(custom_date_format + ' HH:mm');
// Update frequency every three second
setInterval(updateFromCAT, 3000);

// If a radios selected from drop down select radio update.
$('.radios').change(updateFromCAT);

});


