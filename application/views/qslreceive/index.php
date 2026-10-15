<script>
    const CSRF_NAME = '<?= $this->security->get_csrf_token_name(); ?>';
    const CSRF_HASH = '<?= $this->security->get_csrf_hash(); ?>';
</script>
<div class="container-fluid qso_manager pt-3 ps-4 pe-4">
    <h2 class="h5 mb-3"><?php echo lang('menu_view_qsl') . ' &middot; ' . lang('general_word_received'); ?></h2>

    <div class="mb-3">
        <label for="method" class="form-label small mb-0"><?php echo lang('general_word_method'); ?></label>
        <select id="method" class="form-select form-select-sm d-inline-block w-auto me-3">
            <option value="B" selected><?php echo lang('general_word_qslcard_bureau'); ?></option>
            <option value="D"><?php echo lang('general_word_qslcard_direct'); ?></option>
            <option value="E"><?php echo lang('general_word_qslcard_electronic'); ?></option>
            <option value="M"><?php echo lang('general_word_qslcard_manager'); ?></option>
        </select>

        <label for="callsign" class="form-label small mb-0"><?php echo lang('gen_hamradio_call'); ?></label>
        <input type="text" id="callsign" class="form-control form-control-sm d-inline-block w-auto"
               autofocus autocomplete="off" spellcheck="false" placeholder="DL50DAH">
    </div>

    <div id="qslStatus" class="small text-muted mb-2"></div>

    <table class="table table-sm table-striped table-hover" id="qsoTable">
        <thead>
            <tr>
                <th><?php echo lang('gen_hamradio_call'); ?></th>
                <th><?php echo lang('gen_hamradio_band'); ?></th>
                <th><?php echo lang('gen_hamradio_mode'); ?></th>
                <th><?php echo lang('general_word_datetime'); ?></th>
                <th><?php echo lang('general_word_received'); ?></th>
                <th><?php echo lang('general_word_sent'); ?></th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

    <div class="small text-muted mb-2">
        Shift+Enter = mark all shown as received
        <span class="ms-2">&middot; Ctrl+Z = undo last action</span>
    </div>

    <button type="button" class="btn btn-sm btn-secondary" id="undo" disabled>Undo</button>
</div>
