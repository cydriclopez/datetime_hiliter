/*
 * Developed primarily in Chrome because of built-in
 * debug features. Also tested in Firefox. Sorry code
 * not tested in IE I have no windows pc.
 *
 */

// Some globals.
var RGB_BLANK = "transparent";  // Blank

// Different states used in finite-state logic to scrape ajax data in function jsonEncode().
var ST_START = 0,
    ST_BLANK = 1,
    ST_1ST_NON_BLANK = 2,
    ST_MORE_NON_BLANK = 3;

var SHIFT_KEYCODE = "16";
var DOWK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// Global semaphore variable when to apply hiliter pen.
var isWritePen = false;

// Create object to map column number to time string.
var col2time = {
 "0":"12:00AM", "1":"12:15AM", "2":"12:30AM", "3":"12:45AM",
 "4":"01:00AM", "5":"01:15AM", "6":"01:30AM", "7":"01:45AM",
 "8":"02:00AM", "9":"02:15AM","10":"02:30AM","11":"02:45AM",
"12":"03:00AM","13":"03:15AM","14":"03:30AM","15":"03:45AM",
"16":"04:00AM","17":"04:15AM","18":"04:30AM","19":"04:45AM",
"20":"05:00AM","21":"05:15AM","22":"05:30AM","23":"05:45AM",
"24":"06:00AM","25":"06:15AM","26":"06:30AM","27":"06:45AM",
"28":"07:00AM","29":"07:15AM","30":"07:30AM","31":"07:45AM",
"32":"08:00AM","33":"08:15AM","34":"08:30AM","35":"08:45AM",
"36":"09:00AM","37":"09:15AM","38":"09:30AM","39":"09:45AM",
"40":"10:00AM","41":"10:15AM","42":"10:30AM","43":"10:45AM",
"44":"11:00AM","45":"11:15AM","46":"11:30AM","47":"11:45AM",
"48":"12:00PM","49":"12:15PM","50":"12:30PM","51":"12:45PM",
"52":"01:00PM","53":"01:15PM","54":"01:30PM","55":"01:45PM",
"56":"02:00PM","57":"02:15PM","58":"02:30PM","59":"02:45PM",
"60":"03:00PM","61":"03:15PM","62":"03:30PM","63":"03:45PM",
"64":"04:00PM","65":"04:15PM","66":"04:30PM","67":"04:45PM",
"68":"05:00PM","69":"05:15PM","70":"05:30PM","71":"05:45PM",
"72":"06:00PM","73":"06:15PM","74":"06:30PM","75":"06:45PM",
"76":"07:00PM","77":"07:15PM","78":"07:30PM","79":"07:45PM",
"80":"08:00PM","81":"08:15PM","82":"08:30PM","83":"08:45PM",
"84":"09:00PM","85":"09:15PM","86":"09:30PM","87":"09:45PM",
"88":"10:00PM","89":"10:15PM","90":"10:30PM","91":"10:45PM",
"92":"11:00PM","93":"11:15PM","94":"11:30PM","95":"11:45PM"};
var col2time_len = 0;
// Create reverse mapping object needed in function jsonDecode().
var time2col = {};
$.each(col2time, function(key, val){
  time2col[val] = key;
  col2time_len++;
});

// Checks if the provided string is a valid address spec (local@domain.com).
var isValidAddrSpec = function(str) {
  var filter = /^[+a-zA-Z0-9_.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,6}$/;
  return filter.test(str);
};



/***********************************************************************
 * Start define object MonthGridCollection()
 * This object serves as collection of all MonthGrid() objects.
 ***********************************************************************/
function MonthGridCollection(){
  this.add = function(monthGrid){
    if(!this[monthGrid.emailIdStr])
      this[monthGrid.emailIdStr] = {};
    this[monthGrid.emailIdStr][monthGrid.dateSelectStr] = monthGrid;
  }
  this.get = function(monthGridKey){
    var emailIdStr = monthGridKey[0];
    var dateSelectStr = monthGridKey[1];
    return(this[emailIdStr][dateSelectStr]);
  }
  this.show = function(monthGrid){
    var monthGridList = this[monthGrid.emailIdStr];
    $.each(monthGridList, function(key, obj){
      if(monthGrid.dateSelectStr == key)
        obj.visible(true);
      else
        obj.visible(false);
    });
  }
  return true;
}
/***********************************************************************
 * End define object MonthGridCollection()
 ***********************************************************************/



/***********************************************************************
 * Start define object MonthGrid()
 * Each MonthGrid object knows how to address (the corresponding <div>),
 * draw, hide or display itself.
 ***********************************************************************/
function MonthGrid(monthGridKey){
  var emailId = monthGridKey[0];
  var dateSelectStr = monthGridKey[1];
  this.dateSelectStr = dateSelectStr;
  this.dateSelect = new Date(dateSelectStr.replace(/-/g, "/"));
  this.emailId = emailId;
  this.emailIdStr = emailId.replace(/\W/g, "-");
  this.select = "#" + this.emailIdStr + " #" + dateSelectStr;
  this.upLeast = 0;
  this.downMost = 0;
  this.leftLeast = 0;
  this.rightMost = 0;
  this.json = "";
  return true;
}

MonthGrid.prototype.visible = function(bool){
  if(bool)
    $(this.select).addClass("visible");
  else
    $(this.select).removeClass("visible");
}

MonthGrid.prototype.monthLastday = function(){
  return($(this.select + " #dates tr").length);
}

MonthGrid.prototype.initCoord = function(){
  this.upLeast = this.monthLastday();
  this.downMost = 1;
  this.leftLeast = col2time_len;
  this.rightMost = 0;
}

MonthGrid.prototype.resetCoord = function(){
  this.upLeast = 1;
  this.downMost = this.monthLastday();
  this.leftLeast = 0;
  this.rightMost = col2time_len;
}

MonthGrid.prototype.clearGrid = function(){
  var lastDay = this.monthLastday();
  for(var i = 1; i <= lastDay; i++){
    var row = $(this.select + " #days #B" + i).children();
    for(var j = 0; j <= col2time_len; j++){
      row.eq(j).css("background-color", RGB_BLANK);
    }
  }
}

// Called by both drawApply() to show tooltip, and jsonEncode().
// retype = 0 for tooltip display, 1 for json data.
MonthGrid.prototype.timeString = function(row, col, retype){
  if(col >= col2time_len){
    if(row >= this.monthLastday()){
      var nextDate = new Date(this.dateSelect);
      nextDate.setMonth(this.dateSelect.getMonth() + 1);
      nextDate.setDate(1);
      var month = this.dateSelect.getMonth() + 2;
      if(month > 12) month %= 12;
      if(month < 10) month = "0" + month;
      if(retype == 0)
        return(col2time["0"] + " " + DOWK[nextDate.getDay()] + " " + month + "-01");
      else
        return(this.dateSelect.getFullYear() + "-" + month + "-01" + " " + col2time["0"]);
    }else{
      if(retype == 0)
        return(col2time["0"] + " " + $(this.select + " #dates #A" + (row + 1)).children().eq(0).text());
      else
        return(this.dateSelect.getFullYear() + "-" + $(this.select + " #dates #A" + (row + 1)).children().eq(0).text().substr(4) + " " +col2time["0"]);
    }
  }else{
    if(retype == 0)
      return(col2time["" + col] + " " + $(this.select + " #dates #A" + row).children().eq(0).text());
    else
      return(this.dateSelect.getFullYear() + "-" + $(this.select + " #dates #A" + row).children().eq(0).text().substr(4) + " " + col2time["" + col]);
  }
}

/*
 * Function drawApply() is called by event $("#days td").hover() to
 * simulate hiliter writing on calendar month grid. Also used to show
 * the tooltip to aid time selection. This function is also used to
 * measure the rectangle size traveled by the mouse during hover.
 * This rectangle is needed during "non-timerange"
 * (i.e. "single-cell" entry) clean-up by removeNonTimerange() which is
 * in turn called by event $(document).mouseup().
 */
MonthGrid.prototype.drawApply = function(that){
  var curRow = $(that).parent();
  var rowNdx = curRow.parent().children().index(curRow) + 1;
  var colNdx = curRow.children().index($(that));
  if(isWritePen){
    // Measure rectangle size to remove non-timerange error
    // "single-cell" entries clean-up on mouseup() event.
    if(rowNdx < this.upLeast)  this.upLeast  = rowNdx;
    if(rowNdx > this.downMost)  this.downMost = rowNdx;
    if(colNdx < this.leftLeast) this.leftLeast = colNdx;
    if(colNdx > this.rightMost) this.rightMost = colNdx;
    var penTypeLen = $("#penType option").length;
    var penTypeSel = $("#penType option:selected").index();
    if(penTypeSel == 3)
      $(that).css("background-color", "transparent");
    else{
      // penType first (title) & last (wizard) options not hiliter pen types.
      if((penTypeSel > 0) && (penTypeSel < (penTypeLen - 1)))
        // Firefox bug shows up here. Ideally code here would be (which works in Chrome):
        // $(that).css("background-color", $("#penTypeColorButton").css("background-color"));
        // Resorted to the following code using jQuery.data() to store <option> background colors.
        $(that).css("background-color", $("#penType").data("" + penTypeSel));
    }
  }
  // Show tooltip.
  var left = $(that).position().left;
  var top = $(that).position().top;
  var tooltip = $("#tooltip");
  tooltip.text(this.timeString(rowNdx, colNdx, 0));
  tooltip.css({
    "left": left + 10,
    "top": top + 17
  });
}

// This is the main function to draw the month-grid.
MonthGrid.prototype.createMonthTable = function(){
  var that = this;
  var tab = ['<table id="'];
  tab.push(this.dateSelectStr);
  tab.push('" border="1" cellpadding="0" cellspacing="0" class="monthgrid"><tr><td><table id="dates" border="0" cellpadding="0" cellspacing="0"></table></td><td><table id="days" border="0" cellpadding="0" cellspacing="0" style="color: #FFFFFF"></table></td></tr></table>');
  $("#" + this.emailIdStr).append(tab.join(""));

  var tDate = new Date(this.dateSelect);
  var tMonth = tDate.getMonth();
  var sMonth = tMonth + 1;
  var tab = ["<tbody>"];
  for(var i = 1; tMonth == tDate.getMonth(); tDate.setDate(++i)){
    if(i % 2 == 0) tab.push("<tr id='A");
    else tab.push("<tr class='CGray' id='A");
    tab.push(i);
    tab.push("'><td>");
    tab.push(DOWK[tDate.getDay()]);
    tab.push("&nbsp;");
    if(sMonth < 10) tab.push("0");
    tab.push(sMonth);
    tab.push("-");
    if(i < 10) tab.push("0");
    tab.push(i)
    tab.push("</td></tr>");
  }
  tab.push("</tbody>");
  $(this.select + " #dates").html(tab.join(""));

  var tDate = new Date(this.dateSelect);
  var tab = ["<tbody>"];
  for(var i = 1; tMonth == tDate.getMonth(); tDate.setDate(++i)){
    if(i % 2 == 0) tab.push("<tr id='B");
    else tab.push("<tr class='CGray' id='B");
    tab.push(i);
    // 0.:.1.:.2.:.3.:.4.:.5.:.6.:.7.:.8.:.9.:.10:.11:.12:.1.:.2.:.3.:.4.:.5.:.6.:.7.:.8.:.9.:.10:.11:.0
    tab.push("'><td>0</td><td>.</td><td>:</td><td>.</td><td>1</td><td>.</td><td>:</td><td>.</td><td>2</td><td>.</td><td>:</td><td>.</td><td>3</td><td>.</td><td>:</td><td>.</td><td>4</td><td>.</td><td>:</td><td>.</td><td>5</td><td>.</td><td>:</td><td>.</td><td>6</td><td>.</td><td>:</td><td>.</td><td>7</td><td>.</td><td>:</td><td>.</td><td>8</td><td>.</td><td>:</td><td>.</td><td>9</td><td>.</td><td>:</td><td>.</td><td>1</td><td>0</td><td>:</td><td>.</td><td>1</td><td>1</td><td>:</td><td>.</td><td>1</td><td>2</td><td>:</td><td>.</td><td>1</td><td>.</td><td>:</td><td>.</td><td>2</td><td>.</td><td>:</td><td>.</td><td>3</td><td>.</td><td>:</td><td>.</td><td>4</td><td>.</td><td>:</td><td>.</td><td>5</td><td>.</td><td>:</td><td>.</td><td>6</td><td>.</td><td>:</td><td>.</td><td>7</td><td>.</td><td>:</td><td>.</td><td>8</td><td>.</td><td>:</td><td>.</td><td>9</td><td>.</td><td>:</td><td>.</td><td>1</td><td>0</td><td>:</td><td>.</td><td>1</td><td>1</td><td>:</td><td>.</td><td>0</td>");
  }
  tab.push("</tbody>");
  $(this.select + " #days").html(tab.join(""));

  $(this.select + " #days td").mousedown(function(e){
    e.preventDefault();
    // Left click only.
    if(e.which == 1){
      isWritePen = true;
      that.initCoord();
    }
  });
  $(this.select + " #days td").hover(
    function(){that.drawApply(this)},
    function(){that.drawApply(this)}
  );
}

// Finite-state logic to scan & clear the table for "non-timerange"
// (i.e. "single-cell") error entries.
MonthGrid.prototype.removeNonTimerange = function(penColor){
  $("#colorScratchPad").css("background-color", penColor);
  var penColor = $("#colorScratchPad").css("background-color");
  // Rectangle coordinates set by drawApply() for portion cleanup,
  // or resetCoord() for whole grid cleanup.
  for(var j = this.upLeast; j <= this.downMost; j++){
    var row = $(this.select + " #days #B" + j).children();
    var state = ST_START;
    for(var i = this.leftLeast; i <= this.rightMost; i++){
      var entry = row.eq(i).css("background-color");
      switch(state){
        case ST_START:
        case ST_BLANK:
          if(entry == penColor){
            if(i == this.rightMost)
              row.eq(i).css("background-color", RGB_BLANK);
            else
              state = ST_1ST_NON_BLANK;
          }else
            state = ST_BLANK;
          break;
        case ST_1ST_NON_BLANK:
          if(entry == penColor)
            state = ST_MORE_NON_BLANK;
          else{
            row.eq(i-1).css("background-color", RGB_BLANK);
            state = ST_BLANK;
          }
          break;
        case ST_MORE_NON_BLANK:
          if(entry == penColor)
            state = ST_MORE_NON_BLANK;
          else
            state = ST_BLANK;
      }
    }
  }
}

// Finite-state logic to scrape and serialize table grid data into json.
MonthGrid.prototype.jsonEncodeDo = function(penColor){
  // Write to then read from scratch-pad because plain-text color-name don't work.
  $("#colorScratchPad").css("background-color", penColor);
  var penColor = $("#colorScratchPad").css("background-color");
  this.resetCoord();
  this.removeNonTimerange(penColor);
  var jsn = [];
  for(var j = this.upLeast; j <= this.downMost; j++){
    var row = $(this.select + " #days #B" + j).children();
    var state = ST_START;
    for(var i = this.leftLeast; i <= this.rightMost; i++){
      var entry = row.eq(i).css("background-color");
      switch(state){
        case ST_START:
        case ST_BLANK:
          if(entry == penColor)
            state = ST_1ST_NON_BLANK;
          else
            state = ST_BLANK;
          break;
        case ST_1ST_NON_BLANK:
          if(entry == penColor){
            state = ST_MORE_NON_BLANK;
            // Start time
            jsn.push('"');
            jsn.push(this.timeString(j, (i-1), 1));
            jsn.push('":');
          }else
            state = ST_BLANK;
          if(i == this.rightMost){
            // End time
            jsn.push('"');
            jsn.push(this.timeString(j, i, 1));
            jsn.push('"');
            jsn.push(',');
          }
          break;
        case ST_MORE_NON_BLANK:
          if(entry == penColor){
            state = ST_MORE_NON_BLANK;
            if(i == this.rightMost){
              // End time
              jsn.push('"');
              jsn.push(this.timeString(j, i, 1));
              jsn.push('"');
              jsn.push(',');
            }
          }else{
            state = ST_BLANK;
            // End time
            jsn.push('"');
            jsn.push(this.timeString(j, (i-1), 1));
            jsn.push('"');
            jsn.push(',');
          }
      }
    }
  }
  if(jsn[jsn.length - 1] == ',') jsn.pop();
  return(jsn.join(""));
}

MonthGrid.prototype.jsonEncode = function(){
  var that = this;
  var jsn = ["({"];
  $("#penType option").each(function(){
    // Pardon the hardcoding its for testing. Will come up with better code.
    switch($(this).index()){
      case 1:
        jsn.push('"Appointment":{"bgcolor":"LightCoral",');
        jsn.push(that.jsonEncodeDo($("#penType").data("1")));
        jsn.push("},");
        break;
      case 2:
        jsn.push('"Confirm":{"bgcolor":"green",');
        jsn.push(that.jsonEncodeDo($("#penType").data("2")));
        jsn.push("},");
        break;
      case 4:
        jsn.push('"Freetime":{"bgcolor":"orange",');
        jsn.push(that.jsonEncodeDo($("#penType").data("4")));
        jsn.push("}");
    }
  });
  jsn.push("})");
  // Save json so it can be repainted later if needed.
  this.json = jsn.join("");
  return(this.json);
}

// Paint data onscreen from ajax data of following format:
// {"Freetime":{"bgcolor":"orange","2011-07-14 11:00AM":"2011-07-14 01:00PM", ...}}
MonthGrid.prototype.jsonDecodeDo = function(data){
  // Write to then read from scratch-pad because plain-text color-name don't work.
  $("#colorScratchPad").css("background-color", data["bgcolor"]);
  var penColor = $("#colorScratchPad").css("background-color");
  var that = this;
  $.each(data, function(key, val){
    if(key != "bgcolor"){
      var start = key.split(" ");
      var start_col = parseInt(time2col[start[1]], 10);
      var end_col = parseInt(time2col[val.split(" ")[1]], 10);
      end_col = (end_col == 0) ? col2time_len : end_col;
      var j = parseInt(start[0].split("-")[2], 10);
      var row = $(that.select + " #days #B" + j).children();
      for(var i = start_col; i <= end_col; i++){
        row.eq(i).css("background-color", penColor);
      }
    }
  });
}

MonthGrid.prototype.jsonDecode = function(){
  if(this.json == ""){
    alert("Nothing to draw on month-grid. Data empty.");
    return;
  }
  var obj = eval(this.json);
  var that = this;
  $("#penType option").each(function(){
    switch($(this).index()){
      case 1:
        that.jsonDecodeDo(obj["Appointment"]);
        break;
      case 2:
        that.jsonDecodeDo(obj["Confirm"]);
        break;
      case 4:
        that.jsonDecodeDo(obj["Freetime"]);
    }
  });
}
/***********************************************************************
 * End define object MonthGrid()
 ***********************************************************************/



// Some code to maintain tab state copied from jQuery-ui tabs manipulation demo.
$(function(){
  var $tab_title_input = $( "#tab_title");
  var tab_counter = 1;

  var tab_panel_id = "my-freetime";
  var tab_panel_index = 0;

  var monthGridKey = [tab_panel_id, $("#months_select").val()];
  var monthGridCollection = new MonthGridCollection();
  var monthGrid = new MonthGrid(monthGridKey);
  monthGrid.createMonthTable();
  monthGridCollection.add(monthGrid);
  monthGridCollection.show(monthGrid);

  // tabs init with a custom tab template
  var $tabs = $( "#tabs").tabs({
    tabTemplate: "<li><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
  });
  // modal dialog init: custom buttons and a "close" callback reseting the form inside
  var $dialog = $( "#dialog" ).dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Add: function(){
        addTab();
        $( this ).dialog( "close" );
      },
      Cancel: function(){
        $( this ).dialog( "close" );
      }
    },
    open: function(){
      $tab_title_input.focus();
    },
    close: function(){
      $form[ 0 ].reset();
    }
  });
  // addTab form: calls addTab function on submit and closes the dialog
  var $form = $( "form", $dialog ).submit(function(){
    addTab();
    $dialog.dialog( "close" );
    return false;
  });
  // actual addTab function: adds new tab using the title input from the form above
  function addTab(){
    tab_panel_id = $tab_title_input.val() || ("pal" + tab_counter + "@gmail.com");
    if(!isValidAddrSpec(tab_panel_id))
      return;
    monthGridKey = [tab_panel_id, $("#months_select").val()];
    monthGrid = new MonthGrid(monthGridKey);
    $tabs.tabs( "add", "#" + monthGrid.emailIdStr, tab_panel_id );
    // At this point the target divs with proper id names exist & ready for stuffing
    // the month grid table.  Alternative code would be to pass $tabs into MonthGrid
    // constructor and call: $tabs.tabs( "add", "#" + monthGrid.emailIdStr, tab_panel_id )
    monthGrid.createMonthTable();
    monthGridCollection.add(monthGrid);
    monthGridCollection.show(monthGrid);
    tab_counter++;
  }
  // addTab button: just opens the dialog
  $( "#add_tab" ).click(function(){
      $dialog.dialog( "open" );
    });
  // close icon: removing the tab on click
  // note: closable tabs gonna be an option in the future - see http://dev.jqueryui.com/ticket/3924
  $( "#tabs span.ui-icon-close" ).live( "click", function(){
    var index = $( "li", $tabs ).index( $( this ).parent());
    $tabs.tabs( "remove", index );
  });
  // Track current tab then show the corresponding month-grid.
  $('#tabs').bind('tabsselect', function(event, ui){
    tab_panel_id = ui.panel.id;
    tab_panel_index = ui.index;
    $('#months_select').change();
  });
  //**********************************************************************
  // Bulk of creating/searching/showing/hiding each month grid is done here.
  // OOP code pattern makes it simple.
  $('#months_select').change(function(){
    monthGridKey = [tab_panel_id, $("#months_select").val()];
    monthGrid = monthGridCollection.get(monthGridKey);  // Grab grid from collection
    if(!monthGrid){
      monthGrid = new MonthGrid(monthGridKey);  // Create new grid if non-existing
      monthGrid.createMonthTable();
      monthGridCollection.add(monthGrid);       // Add to grid collection
    }
    monthGridCollection.show(monthGrid);    // Show current grid & hide the rest
  });
  //**********************************************************************
  $('#prevMonthButton').click(function(){
    var month_selected = $("#months_select option:selected").index();
    if(month_selected > 0){
      $('#months_select option').eq(--month_selected).attr('selected', 'selected');
      $('#months_select').change();
    }
  });
  $('#nextMonthButton').click(function(){
    var month_selected = $("#months_select option:selected").index();
    var months_select_length = $("#months_select option").length;
    if(month_selected < (months_select_length - 1)){
      $('#months_select option').eq(++month_selected).attr('selected', 'selected');
      $('#months_select').change();
    }
  });
  /*
   * Use of penTypeColorButton rather clumsy but it's quickie thing.
   * Had to resort to this because of some crazy silly Firefox bug.
   * In Firefox each <option> does not get to keep its own background-color.
   * They get affected and changed into the "select" hilite color.
   * So I had to store each color using jQuery.data() method.
   * Setup data needed by $(document).keydown() and $("#penType").change().
   * Store background-color of each <option> element.
   */
  $("#penType option").each(function(index){
    $("#penType").data("" + index, $(this).css("background-color"));
  });
  $(document).keydown(function(e){
    if(e.keyCode == SHIFT_KEYCODE){
      var i = $("#penType option:selected").index() + 1;
      var penTypeLen = $("#penType option").length;
      if(i > (penTypeLen - 2)) i = 0;
      $("#penType").val(i);
      $("#penType").change();
    }
  });
  $("#penType").change(function(){
    var i = $("#penType option:selected").index();
    var bgColor = $("#penType").data("" + i);
    // The next 3 lines is because of weird crazy silly Firefox bug.
    if(i == 0)
      $("#penTypeColorButton").css("background-color", "#F6F6F5");
    else
      // Just this line good enough for Chrome.
      $("#penTypeColorButton").css("background-color", bgColor);
  });
  $(document).mouseup(function(e){
    isWritePen = false;
    var penTypeLen = $("#penType option").length;
    var penTypeSel = $("#penType option:selected").index();
    // penType first (title) & last (wizard) & #3 (erase) options not hiliter pen types.
    if((penTypeSel > 0) && (penTypeSel < (penTypeLen - 1)) && (penTypeSel != 3)){
      var penColor = $("#penTypeColorButton").css("background-color");
      // Call finite-state logic function to scan & clear the table for "non-timerange"
      // (i.e. "single-cell") error entries.
      monthGrid.removeNonTimerange(penColor);
    }
  });
  // Test buttons:
  $("#showJson").click(function(){
    alert(monthGrid.jsonEncode());
  });
  $("#clearGrid").click(function(){
    monthGrid.clearGrid();
  });
  $("#repaintGrid").click(function(){
    monthGrid.jsonDecode();
  });
  //**********************************************************************
  // From Django ajax documentation
  $('html').ajaxSend(function(event, xhr, settings){
    function getCookie(name){
      var cookieValue = null;
      if (document.cookie && document.cookie != ''){
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++){
          var cookie = jQuery.trim(cookies[i]);
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) == (name + '=')){
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))){
      // Only send the token to relative URLs i.e. locally.
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
  });
  //**********************************************************************
});
