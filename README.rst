
Datetime Hiliter Data Entry
===========================
Datetime entry is usually tedious. This is just a simple demo on
datetime entry that mimics hiliter pen marking a calendar grid.

This is a proof-of-concept prototype of a time scheduling project.
This project was going to provide a way for users to publish their
free time availability. It was a way for users to set appointment
to meet each other without resorting to phone tag.

Features
--------
This simple project is specific in purpose. It features the following:
  * Simplified visual date-time entry that mimics hiliter
    pen marking a calendar.
  * Multiple hiliter pens: for appointment request, appointment
    confirm, availability publish, personal time entry, and cancel
    or erase pen.
  * Multiple tabs to check on other users' free time availability
    and request appointment.
  * Time-tooltip popup to aid time selection.
  * Finite-state logic for fast error-correction and json
    encode/decode.
  * Object-oriented javascript code using jquery to abstract
    browser variance.

This demo was developed primarily using Chrome because of its built-in
debug features. Also tested in Firefox/Firebug. Sorry code not tested
in IE. I have no windows pc.

How it works
------------
Download the file index.html and its companion static folder and
its contents. Open index.html with a browser.

Then follow the following steps:
  * Choose the month to display.
  * Choose a Pentype or press Shift to
    cycle thru various pens:
      - Pink (appointment)
      - Green (confirm)
      - White (erase)
      - Orange (freetime)
  * Left-click and drag mouse over the grid to
    hilite datetime entry.
  * Click on "Show JSON".
  * Click on "Clear Grid".
  * Click on "Repaint JSON".
  * Move to another month and repeat
    previous steps
  * You can also add another tab that would
    display other user's time availability.
    Then repeat previous steps on the new tab.

Action Menu is not yet implemented. GUI is still rough and needs
overhaul but this is just demo/proof-of-concept prototype.