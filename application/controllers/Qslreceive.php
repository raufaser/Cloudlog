<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
	Panel for receiving a stack of paper QSL cards: one callsign field that
	filters live, Shift+Enter to mark everything shown as received, and per-row
	buttons for cards that only confirm some QSOs.
*/

class Qslreceive extends CI_Controller {

	function __construct() {
		parent::__construct();
		$this->load->model('user_model');
		if (!$this->user_model->authorize(2)) {
			$this->session->set_flashdata('notice', 'You\'re not allowed to do that!');
			redirect('dashboard');
		}
	}

	public function index() {
		$data['page_title'] = "QSL Cards";
		$data['hasDatePicker'] = false;

		$footerData = [];
		$footerData['scripts'] = [
			'assets/js/sections/qslreceive.js?' . filemtime(realpath(__DIR__ . "/../../assets/js/sections/qslreceive.js"))
		];

		$this->load->view('interface_assets/header', $data);
		$this->load->view('qslreceive/index');
		$this->load->view('interface_assets/footer', $footerData);
	}
}
