/*jshint esnext:true */
(function() {

'use strict';
var table = document.querySelector('.worked-days-table');

attachHighlightHandlers();
attachUnlinkHandlers();
attachDisplayedHandler();
attachInputHandler();

function attachInputHandler() {
  table.addEventListener('input', onInput);
}

function attachHighlightHandlers() {
  table.addEventListener('mouseover', (e) => {
    var td;
    if ((td = e.target.closest('td'))) {
      highlightHolidayFromCell(td);
    }
  });

  table.addEventListener('mouseout', (e) => {
    if (e.target.closest('td')) {
      removeAllHighlights();
    }
  });
}

function attachDisplayedHandler() {
  window.addEventListener('table-displayed', function onTableDisplayed() {
    window.removeEventListener('table-displayed', onTableDisplayed);

    buildModel();
  });
}

function attachUnlinkHandlers() {
  table.addEventListener('click', (e) => {
    if (e.target.matches('.unlink-button')) {
      handleUnlink(e.target.closest('td'));
    }
  });
}

function getHolidayIndexFromDataset(cell) {
  var holidayIdx = cell.dataset.holidayIndex;
  if (!holidayIdx) {
    return null;
  }

  holidayIdx = +holidayIdx;
  if (!holidayIdx || holidayIdx < 0) {
    return null;
  }

  return holidayIdx;
}

function recalculateTotal(tr) {
  var totalCell = tr.querySelector('.total');
  var editableCells = tr.querySelectorAll('td [contenteditable="true"]');
  var total = Array.from(editableCells).filter(cell => cell.textContent.trim()).length;
  totalCell.textContent = total;
}

var model;
function buildModel() {
  model = [];
  Array.from(table.querySelectorAll('[data-holiday-index]')).forEach(cell => {
    var holidayIdx = getHolidayIndexFromDataset(cell);
    if (holidayIdx === null) {
      return;
    }

    var holiday = model[holidayIdx] = model[holidayIdx] || {
      cells: [],
      linked: true
    };
    holiday.cells.push(cell);
  });
}

function handleUnlink(cell) {
  var holidayIdx = getHolidayIndexFromDataset(cell);
  if (holidayIdx === null) {
    return;
  }

  var holiday = model[holidayIdx];
  holiday.linked = !holiday.linked;
  holiday.cells.forEach(
    cell => cell.classList.toggle('cell-unlinked', !holiday.linked)
  );

  if (holiday.linked) {
    mirrorHolidayValue(cell);
  }
}

function highlightHolidayFromCell(cell) {
  var holidayIdx = getHolidayIndexFromDataset(cell);
  if (holidayIdx === null) {
    return;
  }

  var holiday = model[holidayIdx];
  if (holiday.linked) {
    holiday.cells.forEach(cell => cell.classList.add('cell-highlight'));
  } else {
    cell.classList.add('cell-highlight');
  }
}

function removeAllHighlights() {
  Array.from(table.querySelectorAll('.cell-highlight')).forEach(
    (cell) => cell.classList.remove('cell-highlight')
  );
}

function onInput(e) {
  if (e.target.isContentEditable) {
    mirrorHolidayValue(e.target.closest('td'));
  }
}

function mirrorHolidayValue(cell) {
  var holidayIdx = getHolidayIndexFromDataset(cell);
  if (holidayIdx === null) {
    return;
  }
  
  var holiday = model[holidayIdx];
  if (!holiday.linked) {
    return;
  }

  var value = cell.querySelector('[contenteditable="true"]').textContent;
  holiday.cells.forEach(mirroredCell => {
    if (mirroredCell !== cell) {
      var mirroredContent = mirroredCell.querySelector('[contenteditable="true"]');
      mirroredContent.textContent = value || '\u00a0';
    }
  });

  var trs = new Set(holiday.cells.map(cell => cell.closest('tr')));
  trs.forEach(recalculateTotal);
}

})();