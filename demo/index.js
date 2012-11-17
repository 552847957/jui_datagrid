$(function() {

    var elem_dlg_log1 = $("#dlg_demo_grid1_log"),
        log,
        elem_dlg_demo_grid2_opener = $("#dlg_demo_grid2_opener");

    // theme switcher ----------------------------------------------------------
    $("#ui-theme-switcher").change(function() {
        var theme_url = $(this).val();
        $("#ui-theme").attr("href", theme_url);
    });

    // demo grid1 --------------------------------------------------------------
    $("#demo_grid1").jui_datagrid({

        columns: [
            {field: "lastname", visible: "yes", "header": 'Lastname', "headerClass": "th_lastname", "dataClass": "td_lastname"},
            {field: "firstname", visible: "yes", "header": 'Firstname', "headerClass": "th_firstname", "dataClass": "td_firstname"},
            {field: "email", visible: "yes", "header": 'Email', "headerClass": "th_email", "dataClass": "td_email"},
            {field: "gender", visible: "yes", "header": 'Gender', "headerClass": "th_gender", "dataClass": "td_gender"}
        ],

        sorting: [
            {"sortingName": "Code", field: "customer_id", order: ""},
            {"sortingName": "Lastname", field: "lastname", order: "ascending"},
            {"sortingName": "Firstname", field: "firstname", order: "ascending"}
        ],

        filters: [
            {"filterName": "", "filterType": "", field: "", operator: "",
                value: "", value_range: {lower: "", upper: ""}, value_array: [],
                foreignKey: {ref_table: "", ref_pk: "", ref_col: "", condition: ""},
                ajax_autocomplete_url: ""
            }
        ],

        ajaxFetchDataURL: 'ajax/ajax_fetch_data1.php',

        containerClass: 'grid1_container ui-state-default ui-corner-all',
        datagridClass: 'grid1_data ui-widget-content',

        autoSetColumnsWidth: false,

        caption: 'Customers',

        onDelete: function() {
            var a_sel = $(this).jui_datagrid("getSelectedIDs"),
                sel = a_sel.length;
            if(sel == 0) {
                log = 'Nothing selected...';
                create_log(elem_dlg_log1, log);
            } else {
                log = sel + ' Row(s) with ID: ' + a_sel + ' will be deleted.';
                create_log(elem_dlg_log1, log);
            }
        },
        onCellClick: function(event, data) {
            log = 'Click on cell: col ' + data.col + ' row ' + data.row + '.';
            create_log(elem_dlg_log1, log);
        },
        onRowClick: function(event, data) {
            log = 'Row with ID ' + data.row_id + ' ' + data.row_status + '.';
            create_log(elem_dlg_log1, log);
        },
        onDisplay: function() {
            log = 'Datagrid created.';
            create_log(elem_dlg_log1, log);
        }
    });

    $("#selection_multiple").click(function() {
        $("#demo_grid1").jui_datagrid({
            rowSelectionMode: 'multiple'
        })
    });

    $("#selection_single").click(function() {
        $("#demo_grid1").jui_datagrid({
            rowSelectionMode: 'single'
        })
    });

    $("#selection_false").click(function() {
        $("#demo_grid1").jui_datagrid({
            rowSelectionMode: false
        })
    });


    elem_dlg_log1.dialog({
        autoOpen: true,
        width: 400,
        height: 200,
        position: {
            my: "left",
            at: "right",
            of: '#demo_grid1'
        },
        title: "Log demo_grid1"
    });

    $("#log_show").click(function() {
        elem_dlg_log1.dialog("open");
        return false;
    });

    $("#log_hide").click(function() {
        elem_dlg_log1.dialog("close");
        return false;
    });

    $("#log_clear").click(function() {
        elem_dlg_log1.html('');
    });

    // demo grid2 --------------------------------------------------------------
    $("#dlg_demo_grid2").dialog({
        autoOpen: false,
        title: "Customers dialog",
        width: 750,
        height: 380,
        hide: "fade",
        zIndex: 500,
        open: function() {
            // just to fix column widths
            $("#demo_grid2").jui_datagrid('refresh');
        }
    });

    $("#demo_grid2").jui_datagrid({

        columns: [
            {field: "id", visible: "no", "header": 'Code', "headerClass": "", "dataClass": ""},
            {field: "lastname", visible: "yes", "header": 'Lastname', "headerClass": "", "dataClass": ""},
            {field: "firstname", visible: "yes", "header": 'Firstname', "headerClass": "", "dataClass": ""},
            {field: "gender", visible: "yes", "header": 'Gender', "headerClass": "", "dataClass": ""}
        ],

        sorting: [
            {"sortingName": "Code", field: "id", order: "ascending"},
            {"sortingName": "Lastname", field: "lastname", order: ""},
            {"sortingName": "Firstname", field: "firstname", order: ""}
        ],

        ajaxFetchDataURL: 'ajax/ajax_fetch_data2.php',

        containerClass: 'grid2_container ui-state-default ui-corner-all',
        datagridClass: 'grid2_data ui-widget-content',

        paginationOptions: {
            sliderAnimation: false
        }
    });


    elem_dlg_demo_grid2_opener.button({
        icons: {
            primary: 'ui-icon-newwin'
        }
    });

    elem_dlg_demo_grid2_opener.click(function() {
        $("#dlg_demo_grid2").dialog("open");
        return false;
    });


});

function create_log(elem_log, log_line) {
    var line_number = parseInt(elem_log.find("p").length) + 1;
    elem_log.prepend('<p>' + line_number + ') ' + log_line);
}