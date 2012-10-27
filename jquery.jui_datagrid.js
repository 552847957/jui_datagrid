/**
 * jquery plugin which displays data in tabular format (datagrid)
 * Requires jquery, jquery-ui Themes CSS
 * It uses jui_pagination plugin (which requires jquery-ui)
 * Copyright 2012 Christos Pontikis http://pontikis.net
 * Project page https://github.com/pontikis/jui_datagrid
 * UPCOMING Release: 1.00 (?? Oct 2012)
 * License MIT
 */
"use strict";
(function($) {

    var pluginName = 'jui_datagrid';

    // public methods
    var methods = {

        /**
         * @constructor
         * @param options
         * @return {*}
         */
        init: function(options) {

            var elem = this;

            return this.each(function() {

                /**
                 * settings and defaults
                 * using $.extend, settings modification will affect elem.data() and vive versa
                 */
                var settings = elem.data(pluginName);
                if(typeof(settings) == 'undefined') {
                    var defaults = elem.jui_datagrid('getDefaults');
                    settings = $.extend({}, defaults, options);
                } else {
                    settings = $.extend({}, settings, options);
                }
                elem.data(pluginName, settings);

                var container_id = elem.attr("id");

                // bind events
                elem.unbind("onDisplayPagination").bind("onDisplayPagination", settings.onDisplayPagination);
                elem.unbind("onDisplay").bind("onDisplay", settings.onDisplay);

                // initialize plugin html
                if(!elem.data('initialize')) {

                    var datagrid_id, tools_id, pagination_id, rows_id, elem_html;

                    datagrid_id = create_id(settings.datagrid_id_prefix, container_id);
                    elem_html = '<div id="' + datagrid_id + '"></div>';

                    tools_id = create_id(settings.tools_id_prefix, container_id);
                    elem_html += '<div id="' + tools_id + '"></div>';

                    pagination_id = create_id(settings.pagination_id_prefix, container_id);
                    elem_html += '<div id="' + pagination_id + '"></div>';

                    elem.html(elem_html);
                    elem.data('initialize', true);
                }

                // apply style
                $("#" + container_id).removeClass().addClass(settings.containerClass);
                $("#" + datagrid_id).removeClass().addClass(settings.datagridClass);
                $("#" + tools_id).removeClass().addClass(settings.toolsClass);
                $("#" + pagination_id).removeClass().addClass(settings.paginationClass);


                // fetch data and display datagrid
                $.ajax({
                    type: 'POST',
                    url: settings.ajaxFetchDataURL,
                    data: {
                        page_num: settings.pageNum,
                        rows_per_page: settings.rowsPerPage
                    },
                    success: function(data) {
                        var a_data = $.parseJSON(data);
                        var total_rows = a_data['total_rows'];
                        var page_data = a_data['page_data'];

                        if(total_rows == 0) {
                            display_no_data(container_id);
                        } else {
                            display_grid(container_id, total_rows, page_data);
                            apply_grid_style(container_id);
                            if(settings.useToolbar) {
                                display_tools(container_id);
                            }
                            if(total_rows > settings.rowsPerPage) {
                                display_pagination(container_id, total_rows);
                            }

                            // click on refresh button
                            if(settings.showRefreshButton) {
                                var selector = "#" + create_id(settings.tools_id_prefix, container_id) + '_' + 'refresh';
                                $("#" + container_id).off('click', selector).on('click', selector, function() {
                                    $("#" + container_id).jui_datagrid('refresh');
                                });
                            }

                            /* CREATE PREFERENCES DIALOG -------------------- */
                            if(settings.showPrefButton) {
                                var pref_dialog_id = create_id(settings.pref_dialog_id_prefix, container_id);
                                if($('#' + pref_dialog_id).length == 0) {
                                    var pref_html = '<div id="' + pref_dialog_id + '"></div>';
                                    elem.append(pref_html);
                                }

                                selector = "#" + create_id(settings.tools_id_prefix, container_id) + '_' + 'pref';
                                $("#" + container_id).off('click', selector).on('click', selector, function(event) {

                                    if(typeof($("#" + pref_dialog_id).data('dialog')) == 'object') {
                                        $("#" + pref_dialog_id).dialog('destroy');
                                    }

                                    $("#" + pref_dialog_id).dialog({
                                        autoOpen: true,
                                        show: "blind",
                                        hide: "explode",
                                        position: {
                                            my: "top",
                                            at: "top",
                                            of: '#' + container_id
                                        },
                                        title: rsc_jui_dg.preferences,
                                        buttons: [
                                            {
                                                text: rsc_jui_dg.preferences_close,
                                                click: function() {
                                                    $(this).dialog("close");
                                                    $(this).dialog("destroy");
                                                }
                                            }
                                        ],
                                        open: create_preferences(container_id)
                                    })
                                });


                                selector = "#" + pref_dialog_id + '_slider';
                                $("#" + pref_dialog_id).off('click', selector).on('click', selector, function(event) {
                                    var state = $(event.target).is(":checked");
                                    elem.jui_datagrid('setPaginationOptions',
                                        {
                                            useSlider: state
                                        }
                                    )
                                });

                                selector = "#" + pref_dialog_id + '_goto_page';
                                $("#" + pref_dialog_id).off('click', selector).on('click', selector, function(event) {
                                    var state = $(event.target).is(":checked");
                                    elem.jui_datagrid('setPaginationOptions',
                                        {
                                            showGoToPage: state
                                        })
                                });

                                selector = "#" + pref_dialog_id + '_rows_per_page';
                                $("#" + pref_dialog_id).off('click', selector).on('click', selector, function(event) {
                                    var state = $(event.target).is(":checked");
                                    elem.jui_datagrid('setPaginationOptions',
                                        {
                                            showRowsPerPage: state
                                        })
                                });


                            }

                            // trigger event
                            elem.triggerHandler("onDisplay");
                        }
                    }
                });
            });
        },


        /**
         * Get default values
         * Usage: $(element).jui_datagrid('getDefaults');
         * @return {Object}
         */
        getDefaults: function() {
            var defaults = {
                pageNum: 1,
                rowsPerPage: 10,

                // toolbar options
                useToolbar: true,
                showPrefButton: true,
                showSelectButtons: true,
                showSelectLabel: false,
                showRefreshButton: true,
                showDeleteButton: true,
                showPrintButton: true,
                showExportButton: true,
                showFiltersButton: true,
                showPrefButtonText: false,
                showSelectAllButtonText: false,
                showSelectNoneButtonText: false,
                showSelectInverseButtonText: false,
                showRefreshButtonText: false,
                showDeleteButtonText: true,
                showPrintButtonText: false,
                showExportButtonText: false,
                showFiltersButtonText: false,

                // pagination options
                usePagination: true,
                showGoToPage: true,
                showRowsPerPage: true,
                showRowsInfo: true,
                showPaginationPreferences: true,

                // main divs classes
                containerClass: 'grid_container ui-state-default ui-corner-all',
                datagridClass: 'grid_data',
                toolsClass: 'grid_tools ui-state-default ui-corner-all',
                paginationClass: 'grid_pagination',

                // data table classes
                applyUIGridStyle: true,
                tableClass: 'grid_table',
                trHoverClass: 'ui-state-hover trhover',
                thClass: 'ui-state-default',
                tdClass: 'ui-widget-content',

                //toolbar classes
                tbButtonContainer: 'tbBtnContainer',
                tbPrefIconClass: 'ui-icon-gear',
                tbSelectLabelClass: 'selectLabelClass',
                tbSelectAllIconClass: 'ui-icon-circle-check',
                tbSelectNoneIconClass: 'ui-icon-circle-close',
                tbSelectInverseIconClass: 'ui-icon-check',
                tbRefreshIconClass: 'ui-icon-refresh',
                tbDeleteIconClass: 'ui-icon-trash',
                tbPrintIconClass: 'ui-icon-print',
                tbExportIconClass: 'ui-icon-extlink',
                tbFiltersIconClass: 'ui-icon-search',

                // elements id prefix
                datagrid_id_prefix: 'dg_',
                table_id_prefix: 'tbl_',
                tools_id_prefix: 'tools_',
                pagination_id_prefix: 'pag_',

                pref_dialog_id_prefix: 'pref_dlg_',

                onDisplayPagination: function() {
                },
                onDisplay: function() {
                }
            };
            return defaults;
        },

        /**
         * Get any option set to plugin using its name (as string)
         * Usage: $(element).jui_datagrid('getOption', some_option);
         * @param opt
         * @return {*}
         */
        getOption: function(opt) {
            var elem = this;
            return elem.data(pluginName)[opt];
        },

        /**
         * Get all options
         * Usage: $(element).jui_datagrid('getAllOptions');
         * @return {*}
         */
        getAllOptions: function() {
            var elem = this;
            return elem.data(pluginName);
        },

        /**
         * Set option
         * Usage: $(element).jui_datagrid('setOption', 'option_name',  'option_value',  reinit);
         * @param opt
         * @param val
         * @param reinit
         */
        setOption: function(opt, val, reinit) {
            var elem = this;
            elem.data(pluginName)[opt] = val;
            if(reinit) {
                elem.jui_datagrid('init');
            }
        },

        /**
         * Refresh plugin
         * Usage: $(element).jui_datagrid('refresh');
         * @return {*|jQuery}
         */
        refresh: function() {
            var elem = this;
            elem.jui_datagrid();
        },

        /**
         * Destroy plugin
         * Usage: $(element).jui_datagrid('destroy');
         * @return {*|jQuery}
         */
        destroy: function() {
            return $(this).each(function() {
                var $this = $(this);
                var datagrid_container_id = $this.attr("id");
                var pagination_container_id = $this.jui_datagrid('getOption', 'pagination_id_prefix') + datagrid_container_id;

                $("#" + pagination_container_id).removeData();
                $this.removeData();
            });
        },

        /**
         * Apply styles to datagrid table
         * @param tableClass
         * @param trHoverClass
         * @param thClass
         * @param tdClass
         */
        setGridStyle: function(tableClass, trHoverClass, thClass, tdClass) {
            var elem = this;
            var table_selector = '#' + create_id($(elem).jui_datagrid('getOption', 'table_id_prefix'), elem.attr("id"));

            $(table_selector).removeClass().addClass(tableClass);

            if(trHoverClass != '') {
                $(table_selector).on('mouseover mouseout', 'tbody tr', function(event) {
                    $(this).children().toggleClass(trHoverClass, event.type == 'mouseover');
                });
            }

            $(table_selector).find("th").removeClass().addClass(thClass);
            $(table_selector).find("td").removeClass().addClass(tdClass);
        },

        /**
         * Set pagination options
         * Usage: $(element).jui_datagrid('setPaginationOptions', pag_options);
         * @param pag_options
         */
        setPaginationOptions: function(pag_options) {
            var datagrid_container_id = this.attr("id");
            var pagination_id = $("#" + datagrid_container_id).jui_datagrid('getOption', 'pagination_id_prefix') + datagrid_container_id;
            $("#" + pagination_id).jui_pagination(pag_options);
        },

        /**
         * Get all pagination options
         * Usage: $(element).jui_datagrid('getAllPaginationOptions');
         * @return {*}
         */
        getPaginationOption: function(opt) {
            var datagrid_container_id = this.attr("id");
            var pagination_id = $("#" + datagrid_container_id).jui_datagrid('getOption', 'pagination_id_prefix') + datagrid_container_id;
            return $("#" + pagination_id).jui_pagination('getOption', opt);
        },

        /**
         * Get all pagination options
         * Usage: $(element).jui_datagrid('getAllPaginationOptions');
         * @return {*}
         */
        getAllPaginationOptions: function() {
            var datagrid_container_id = this.attr("id");
            var pagination_id = $("#" + datagrid_container_id).jui_datagrid('getOption', 'pagination_id_prefix') + datagrid_container_id;
            return $("#" + pagination_id).jui_pagination('getAllOptions');
        }

    };

    /* private methods ------------------------------------------------------ */

    /**
     * Create element id
     * @param prefix
     * @param container_id
     * @return {*}
     */
    var create_id = function(prefix, plugin_container_id) {
        return prefix + plugin_container_id;
    };


    /**
     * Create preferences
     * @param plugin_container_id
     */
    var create_preferences = function(plugin_container_id) {
        var prefix = $("#" + plugin_container_id).jui_datagrid('getOption', 'pref_dialog_id_prefix');
        var dialog_id = create_id(prefix, plugin_container_id);
        var pref_id;
        var state;

        var pref_html = '';
        pref_html += '<ul style="list-style-type: none;">';

        pref_id = dialog_id + '_slider';
        pref_html += '<li>';
        pref_html += '<input type="checkbox" id="' + pref_id + '" /><label for="' + pref_id + '">' + rsc_jui_pag.pref_show_slider + '</label>';
        pref_html += '</li>';

        pref_id = dialog_id + '_goto_page';
        pref_html += '<li>';
        pref_html += '<input type="checkbox" id="' + pref_id + '" /><label for="' + pref_id + '">' + rsc_jui_pag.pref_show_goto_page + '</label>';
        pref_html += '</li>';

        pref_id = dialog_id + '_rows_per_page';
        pref_html += '<li>';
        pref_html += '<input type="checkbox" id="' + pref_id + '" /><label for="' + pref_id + '">' + rsc_jui_pag.pref_show_rows_per_page + '</label>';
        pref_html += '</li>';

        pref_html += '</ul>';

        $("#" + dialog_id).html(pref_html);

        pref_id = dialog_id + '_slider';
        state = $("#" + plugin_container_id).jui_datagrid('getPaginationOption', 'useSlider');
        $("#" + pref_id).attr("checked", state);

        pref_id = dialog_id + '_goto_page';
        state = $("#" + plugin_container_id).jui_datagrid('getPaginationOption', 'showGoToPage');
        $("#" + pref_id).attr("checked", state);

        pref_id = dialog_id + '_rows_per_page';
        state = $("#" + plugin_container_id).jui_datagrid('getPaginationOption', 'showRowsPerPage');
        $("#" + pref_id).attr("checked", state);
    };

    /**
     * Display datagrid
     * @param container_id
     * @param total_rows
     * @param page_data
     */
    var display_grid = function(container_id, total_rows, page_data) {

        var elem = $("#" + container_id);
        var page_rows = page_data.length;
        var datagrid_id = elem.jui_datagrid('getOption', 'datagrid_id_prefix') + container_id;
        var table_id = elem.jui_datagrid('getOption', 'table_id_prefix') + container_id;

        var tbl = '<table id="' + table_id + '">';

        tbl += '<thead>';
        tbl += '<tr>';
        $.each(page_data[0], function(index, value) {
            tbl += '<th>' + index + '</th>';
        });
        tbl += '<tr>';
        tbl += '</thead>';

        tbl += '<tbody>';
        for(var i = 0; i < page_rows; i++) {
            tbl += '<tr>';
            $.each(page_data[i], function(index, value) {
                tbl += '<td>' + value + '</td>';
            });
            tbl += '</tr>';
        }
        tbl += '<tbody>';

        tbl += '</table>';

        $("#" + datagrid_id).html(tbl);

    };


    /**
     * Apply grid style
     * @param container_id
     */
    var apply_grid_style = function(container_id) {

        var elem = $("#" + container_id);
        if(elem.jui_datagrid('getOption', 'applyUIGridStyle')) {
            elem.jui_datagrid('setGridStyle',
                elem.jui_datagrid('getOption', 'tableClass'),
                elem.jui_datagrid('getOption', 'trHoverClass'),
                elem.jui_datagrid('getOption', 'thClass'),
                elem.jui_datagrid('getOption', 'tdClass'));
        }

    };

    /**
     * Display tools
     * @param container_id
     */
    var display_tools = function(container_id) {

        var elem = $("#" + container_id);
        var tools_id = create_id(elem.jui_datagrid('getOption', 'tools_id_prefix'), container_id);
        var toolsClass = elem.jui_datagrid('getOption', 'toolsClass');

        var tbButtonContainer = elem.jui_datagrid('getOption', 'tbButtonContainer');

        var showPrefButton = elem.jui_datagrid('getOption', 'showPrefButton');
        var showPrefButtonText = elem.jui_datagrid('getOption', 'showPrefButtonText');
        var tbPrefIconClass = elem.jui_datagrid('getOption', 'tbPrefIconClass');

        var showSelectButtons = elem.jui_datagrid('getOption', 'showSelectButtons');
        var showSelectLabel = elem.jui_datagrid('getOption', 'showSelectLabel');
        var tbSelectLabelClass = elem.jui_datagrid('getOption', 'tbSelectLabelClass');
        var tbSelectAllIconClass = elem.jui_datagrid('getOption', 'tbSelectAllIconClass');
        var tbSelectNoneIconClass = elem.jui_datagrid('getOption', 'tbSelectNoneIconClass');
        var tbSelectInverseIconClass = elem.jui_datagrid('getOption', 'tbSelectInverseIconClass');
        var showSelectAllButtonText = elem.jui_datagrid('getOption', 'showSelectAllButtonText');
        var showSelectNoneButtonText = elem.jui_datagrid('getOption', 'showSelectNoneButtonText');
        var showSelectInverseButtonText = elem.jui_datagrid('getOption', 'showSelectInverseButtonText');

        var showRefreshButton = elem.jui_datagrid('getOption', 'showRefreshButton');
        var showRefreshButtonText = elem.jui_datagrid('getOption', 'showRefreshButtonText');
        var tbRefreshIconClass = elem.jui_datagrid('getOption', 'tbRefreshIconClass');

        var showDeleteButton = elem.jui_datagrid('getOption', 'showDeleteButton');
        var showDeleteButtonText = elem.jui_datagrid('getOption', 'showDeleteButtonText');
        var tbDeleteIconClass = elem.jui_datagrid('getOption', 'tbDeleteIconClass');

        var showPrintButton = elem.jui_datagrid('getOption', 'showPrintButton');
        var showPrintButtonText = elem.jui_datagrid('getOption', 'showPrintButtonText');
        var tbPrintIconClass = elem.jui_datagrid('getOption', 'tbPrintIconClass');

        var showExportButton = elem.jui_datagrid('getOption', 'showExportButton');
        var showExportButtonText = elem.jui_datagrid('getOption', 'showExportButtonText');
        var tbExportIconClass = elem.jui_datagrid('getOption', 'tbExportIconClass');

        var showFiltersButton = elem.jui_datagrid('getOption', 'showFiltersButton');
        var showFiltersButtonText = elem.jui_datagrid('getOption', 'showFiltersButtonText');
        var tbFiltersIconClass = elem.jui_datagrid('getOption', 'tbFiltersIconClass');

        var tools_html = '';

        if(showPrefButton) {
            tools_html += '<div class="' + tbButtonContainer + '">';

            var pref_id = tools_id + '_' + 'pref';
            tools_html += '<button id="' + pref_id + '">' + rsc_jui_dg.preferences + '</button>';

            tools_html += '</div>';
        }

        if(showSelectButtons) {
            tools_html += '<div class="' + tbButtonContainer + '">';

            var select_label_id = tools_id + '_' + 'select_label';
            if(showSelectLabel) {
                tools_html += '<label id="' + select_label_id + '">' + rsc_jui_dg.select_label + '</label>';
            }

            var select_all_id = tools_id + '_' + 'select_all';
            tools_html += '<button id="' + select_all_id + '">' + rsc_jui_dg.select_all + '</button>';

            var select_none_id = tools_id + '_' + 'select_none';
            tools_html += '<button id="' + select_none_id + '">' + rsc_jui_dg.select_none + '</button>';

            var select_inv_id = tools_id + '_' + 'select_inverse';
            tools_html += '<button id="' + select_inv_id + '">' + rsc_jui_dg.select_inverse + '</button>';

            tools_html += '</div>';
        }

        if(showRefreshButton) {
            tools_html += '<div class="' + tbButtonContainer + '">';

            var refresh_id = tools_id + '_' + 'refresh';
            tools_html += '<button id="' + refresh_id + '">' + rsc_jui_dg.refresh + '</button>';

            tools_html += '</div>';
        }

        if(showDeleteButton) {
            tools_html += '<div class="' + tbButtonContainer + '">';

            var delete_id = tools_id + '_' + 'delete';
            tools_html += '<button id="' + delete_id + '">' + rsc_jui_dg.delete + '</button>';

            tools_html += '</div>';
        }

        if(showPrintButton || showExportButton) {
            tools_html += '<div class="' + tbButtonContainer + '">';
        }

        if(showPrintButton) {
            var print_id = tools_id + '_' + 'print';
            tools_html += '<button id="' + print_id + '">' + rsc_jui_dg.print + '</button>';
        }

        if(showExportButton) {
            var export_id = tools_id + '_' + 'export';
            tools_html += '<button id="' + export_id + '">' + rsc_jui_dg.export + '</button>';
        }


        if(showPrintButton || showExportButton) {
            tools_html += '</div>';
        }


        if(showFiltersButton) {
            tools_html += '<div class="' + tbButtonContainer + '">';

            var filters_id = tools_id + '_' + 'filters';
            tools_html += '<button id="' + filters_id + '">' + rsc_jui_dg.filters + '</button>';

            tools_html += '</div>';
        }


        $("#" + tools_id).html(tools_html);

        if(showPrefButton) {
            $("#" + pref_id).button({
                label: rsc_jui_dg.preferences,
                text: showPrefButtonText,
                icons: {
                    primary: tbPrefIconClass
                }
            });
        }

        if(showSelectButtons) {

            $("#" + select_label_id).removeClass().addClass(tbSelectLabelClass);

            $("#" + select_all_id).button({
                label: rsc_jui_dg.select_all,
                text: showSelectAllButtonText,
                icons: {
                    primary: tbSelectAllIconClass
                }
            });

            $("#" + select_none_id).button({
                label: rsc_jui_dg.select_none,
                text: showSelectNoneButtonText,
                icons: {
                    primary: tbSelectNoneIconClass
                }
            });

            $("#" + select_inv_id).button({
                label: rsc_jui_dg.select_inverse,
                text: showSelectInverseButtonText,
                icons: {
                    primary: tbSelectInverseIconClass
                }
            });
        }

        if(showRefreshButton) {
            $("#" + refresh_id).button({
                label: rsc_jui_dg.refresh,
                text: showRefreshButtonText,
                icons: {
                    primary: tbRefreshIconClass
                }
            });
        }

        if(showDeleteButton) {
            $("#" + delete_id).button({
                label: rsc_jui_dg.delete,
                text: showDeleteButtonText,
                icons: {
                    primary: tbDeleteIconClass
                }
            });
        }

        if(showPrintButton) {
            $("#" + print_id).button({
                label: rsc_jui_dg.print,
                text: showPrintButtonText,
                icons: {
                    primary: tbPrintIconClass
                }
            });
        }

        if(showExportButton) {
            $("#" + export_id).button({
                label: rsc_jui_dg.export,
                text: showExportButtonText,
                icons: {
                    primary: tbExportIconClass
                }
            });
        }

        if(showFiltersButton) {
            $("#" + filters_id).button({
                label: rsc_jui_dg.filters,
                text: showFiltersButtonText,
                icons: {
                    primary: tbFiltersIconClass
                }
            });
        }

    };

    /**
     * Display pagination
     * @param container_id
     * @param total_rows
     */
    var display_pagination = function(container_id, total_rows) {

        var elem = $("#" + container_id);
        var rowsPerPage = elem.jui_datagrid('getOption', 'rowsPerPage');
        var currentPage = elem.jui_datagrid('getOption', 'pageNum');
        var total_pages = Math.ceil(total_rows / rowsPerPage);
        var paginationClass = elem.jui_datagrid('getOption', 'paginationClass');
        var pagination_id = create_id(elem.jui_datagrid('getOption', 'pagination_id_prefix'), container_id);

        $("#" + pagination_id).show();

        if(typeof ($("#" + pagination_id).data('jui_pagination')) == 'undefined') {
            $("#" + pagination_id).jui_pagination({
                currentPage: currentPage,
                totalPages: total_pages,
                containerClass: paginationClass,
                onChangePage: function(event, page_number) {
                    elem.data('jui_datagrid').pageNum = page_number;
                    elem.jui_datagrid({'pageNum': page_number});
                }
            });

            // trigger event
            elem.triggerHandler("onDisplayPagination", pagination_id);
        }

    };

    /**
     * Display datagrid with no rows
     * @param container_id
     */
    var display_no_data = function(container_id) {

        var elem = $("#" + container_id);
        var datagrid_id = elem.jui_datagrid('getOption', 'datagrid_id_prefix') + container_id;
        var pagination_id = elem.jui_datagrid('getOption', 'pagination_id_prefix') + container_id;

        $("#" + datagrid_id).html(rsc_jui_dg.no_records_found);
        $("#" + pagination_id).hide();

    };


    $.fn.jui_datagrid = function(method) {

        if(this.size() != 1) {
            var err_msg = 'You must use this plugin with a unique element (at once)';
            this.html('<span style="color: red;">' + 'ERROR: ' + err_msg + '</span>');
            $.error(err_msg);
        }

        // Method calling logic
        if(methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if(typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.' + pluginName);
        }

    };

})(jQuery);