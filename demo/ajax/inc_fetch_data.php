<?php
/**
 * Sample php file getting totalrows and database data for current page
 *
 */

// prevent direct access (optional) --------------------------------------------
$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) AND
	strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
if(!$isAjax) {
	print 'Access denied - not an AJAX request...' . ' (' . __FILE__ . ')';
	exit;
}

// required --------------------------------------------------------------------
require_once '../mysql/settings.php';
require_once '../lib/adodb_5.18a/adodb.inc.php';
require_once '../../lib/jui_filter_rules_v1.00/server_side/php/jui_filter_rules.php';
require_once '../../server_side/php/jui_datagrid.php';

// initialize ------------------------------------------------------------------
$total_rows = null;
$a_data = null;
$last_error = null;
$result = array(
	'total_rows' => $total_rows,
	'page_data' => $a_data,
	'error' => $last_error
);

// get params ------------------------------------------------------------------
$page_num = $_POST['page_num'];
$rows_per_page = $_POST['rows_per_page'];

$filter_rules = array();
if(isset($_POST['filter_rules'])) {
	$filter_rules = $_POST['filter_rules'];
}

$sorting = array();
if(isset($_POST['sorting'])) {
	$sorting = $_POST['sorting'];
}

// -----------------------------------------------------------------------------
$jdg = new jui_datagrid();
$conn = $jdg->db_connect($dbcon_settings);
if($conn === false) {
	$last_error = 'Cannot connect to database';
} else {
	$where = $jdg->get_whereSQL($conn, $filter_rules);
	$whereSQL = $where['sql'];
	$bind_params = $where['bind_params'];

	$total_rows = $jdg->get_total_rows($conn, $selectCountSQL, $whereSQL, $bind_params);

	if($total_rows === false) {
		$last_error = $jdg->get_last_error();
	} else {
		$a_data = $jdg->fetch_page_data($conn, $page_num, $rows_per_page, $selectSQL, $sorting, $whereSQL, $bind_params);
		if($a_data === false) {
			$last_error = $jdg->get_last_error();
		}
	}

	$jdg->db_disconnect($conn);
}

// return JSON -----------------------------------------------------------------
$result['total_rows'] = $total_rows;
$result['page_data'] = $a_data;
$result['error'] = $last_error;
$json = json_encode($result);
print $json;
?>
