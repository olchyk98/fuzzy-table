const {
  addIndex,
  assocPath,
  chain,
  equals,
  filter,
  forEach,
  fromPairs,
  identity,
  is,
  keys,
  map,
  path,
  propOr,
  toPairs,
} = window.R

const forEachIndexed = addIndex(forEach)

/**
* Plucks keys from all objects in the passed array.
*
* @param {object[]} objects
* @return {void}
*/
function getAllKeys (objects) {
  const allKeys = chain(identity, map(keys, objects))
  const keysSet = new Set(allKeys)
  return Array.from(keysSet)
}

/**
* Returns a copy of the passed array
* without the passed object.
*
* @param {any} item
* @param {any[]} arr
* @return {any[]}
*/
function deleteFromArr (item, arr) {
  return filter(equals(item), arr)
}

////////////////////////////////////////////////////////////////////////////

const SELECTED_CLASS = 'selected'
const POSY_ATTR = 'attrY'
const POSX_ATTR = 'attrX'
const CELLLABEL_ATTR = 'clabel'

class FuzzyTable {
  constructor (config) {
    /**
    * Targeted table element.
    * Used to display and control values.
    * Will be cleared once table is
    * ready to be initialized.
    *{cw
    * @type {HTMLElement}
    */
    this.target = null

    /**
    * Passed data object that is used to generate
    * the table.
    *
    * @type {object}
    */
    this.data = {}

    /**
    * Array of head labels extracted
    * from the passed data object.
    *
    * @type {string[]}
    */
    this.headLabels = []

    /**
    * Array of column properties.
    * Can have max length of this.headLabels,
    * as it's directly linked and managed
    * by the header part of the target table.
    *
    * If header at a specific position doesn't
    * have a defined spec in this array,
    * a regular text field spec will be used.
    *
    * @param {object[]}
    */
    this.columnEditors = []

    /**
    * Array of currently selected cells.
    *
    * @type {Cell[]}
    */
    this.selectionBuffer = []

    /**
    * Vector2 that represents
    * position where the user started dragging/selecting
    * with the left button.
    * By holding the left button the user
    * can select multiple cells,
    * so it's important to keep track
    * of this in the state to be able to properly
    * handle area selection.
    *
    * @type {vector2}
    */
    this.multiSelectingStart = false

    this.init(config)
  }

  /**
  * Inits the instance and fills target with the
  * populated data.
  *
  * @param {HTMLElement} target
  * @param {object[]} data
  */
  init ({ target, data, columns, columnProperties }) {
    this.target = target

    this.headLabels = columns || getAllKeys(data)
    this.columnEditors = columnProperties

    // Arrow function is needed here,
    // because otherwise this context is losed.
    this.data = map((r) => this.orderRowData(r), data)

    this.renderHead()
    this.renderRows()

    this.subscribeToEvents()
  }

  /**
  * Sets row data in a order of the head element.
  *
  * @param {object} rowData
  * @return {object}
  */
  orderRowData (rowData) {
    const pairs = toPairs(rowData)
    const sortedPairs = new Array(pairs.length).fill('')

    forEach((pair) => {
      const index = this.headLabels.indexOf(pair[0])
      sortedPairs[index] = pair
    }, pairs)

    return fromPairs(sortedPairs)
  }

  // TODO: Sort each row by keys
  // TODO ...clear all table children before starting

  /**
  * Renders the head tag of the targeted
  * table.
  */
  renderHead () {
    // Create a new node that will be used as the head.
    const head = document.createElement('tr')

    // Iterate through all head keys and push them into the node.
    forEach((label) => {
      const key = document.createElement('th')
      key.textContent = label
      head.appendChild(key)
    }, this.headLabels)

    // Push generated head to the targeted table.
    this.target.appendChild(head)
  }

  /**
  * Renders every available row to the table
  * from the storage.
  */
  renderRows () {
    // Render rows
    forEachIndexed((rowData, posY) => {
      const row = document.createElement('tr')
      const pairs = toPairs(rowData)

      // Render row columns (values for the row)
      forEachIndexed((key, posX) => {
        const value = propOr([], posX, pairs)?.[1]
        const cell = document.createElement('td')

        this.initCellListeners(cell)
        this.assignCellPosition(cell, [ posX, posY ], key)

        row.appendChild(cell)
        this.renderCell(cell, value)
      }, this.headLabels)

      this.target.appendChild(row)
    }, this.data)
  }

  /**
  * Returns editor for the passed column.
  *
  * @param {string|number} column
  * If number is passed, it will be used as index.
  * If string is passed, it will be used as key.
  * @return {void}
  */
  getColumnEditor (column) {
    const columnIndex = is(Number, column)
      ? column
      : this.headLabels.indexOf(column)

    const externalEditor = this.columnEditors[columnIndex]
    if (externalEditor) return externalEditor

    return {
      render: (value, cell) => cell.textContent = value
    }
  }

  /**
  * Unselectes the passed cell.
  *
  * @param {HTMLElement} cell
  */
  unselectCell (cell) {
    this.selectionBuffer = deleteFromArr(cell, this.selectionBuffer)
    cell.classList.remove(SELECTED_CLASS)
  }

  /**
  * Clears the selection buffer.
  * Unselects all selected cells.
  */
  clearSelection () {
    // Go through all selected cells and unselect them.
    // Arrow function is needed here in case to keep the context.
    forEach((c) => this.unselectCell(c), this.selectionBuffer)

    // Clear the buffer
    this.selectionBuffer = []
  }

  /**
  * Highlights the passed cell.
  *
  * @param {HTMLElement} cell
  * @param {boolean} clearBuffer
  * Boolean that represents if any other selected cells should
  * be unselected.
  */
  selectCell (cell, clearBuffer = true) {
    if(clearBuffer) {
      this.clearSelection()
    }

    // Select the passed cell
    cell.classList.add(SELECTED_CLASS)
    this.selectionBuffer.push(cell)
  }

  /**
  * Selects all passed cells.
  * Changes are reflected in the buffer
  *
  * @param {HTMLElement} cells
  */
  selectCells (cells) {
    // Arrow function is needed here to keep the context.
    map((c) => this.selectCell(c, false), cells)
  }

  /**
  * Selects all cells from the start dragging
  * to the passed one.
  * The function is originally used for the mutli selecting support.
  *
  * @param {HTMLElement} cell
  */
  selectCellArea (cell) {
    this.clearSelection()
    const targetCells = []

    const start = this.multiSelectingStart
    const end = this.getCellAxisPosition(cell)

    for(let mx = start[0]; mx <= end[0]; ++mx) {
      for(let my = start[1]; my <= end[1]; ++my) {
        const cell = document.querySelector(`[${POSX_ATTR}="${mx}"][${POSY_ATTR}="${my}"]`)
        targetCells.push(cell)
      }
    }

    this.selectCells(targetCells)
  }

  /**
  * Returns position in the data buffer
  * of the specific cell.
  *
  * @param {HTMLElement} cell
  */
  getCellDataPosition (cell) {
    const posY = cell.getAttribute(POSY_ATTR)
    const key = cell.getAttribute(CELLLABEL_ATTR)

    return [ posY, key ]
  }

  /**
  * Returns vector2 of the passed cell
  * in the body grid.
  *
  * @param {HTMLElement} cell
  * @return {vector2}
  */
  getCellAxisPosition (cell) {
    const posY = cell.getAttribute(POSY_ATTR)
    const posX = cell.getAttribute(POSX_ATTR)

    return [ Number(posX), Number(posY) ]
  }

  /**
  * Returns content data of the passed cell.
  *
  * @param {HTMLElement} cell
  * @return {string}
  */
  getCellValue (cell) {
    const position = this.getCellDataPosition(cell)
    return path(position, this.data)
  }

  /**
  * Writes a new value
  * to the passed cell in the
  * data buffer.
  *
  * @param {HTMLElement} cell
  * @param {string} value
  * @return {string} value
  */
  writeCellValue (cell, value) {
    const position = this.getCellDataPosition(cell)
    this.data = assocPath(position, value, this.data)

    this.renderCell(cell, value)
    return value
  }

  /**
  * Replace content of the cell
  * with a text input.
  * Makes the passed cell editable.
  * Once blurred, the value is saved.
  *
  * @param {HTMLElement} cell
  */
  editCell (cell) {
    // Get original cell data
    const cellValue = this.getCellValue(cell)

    // Replace contents of the node with input
    cell.innerHTML = ''

    // Create and focus input in the cell
    const input = document.createElement('input')
    input.value = cellValue

    cell.appendChild(input)
    input.focus()

    // Listen to the blur event for the input
    const listener = () => {
      input.removeEventListener('blur', listener)
      this.writeCellValue(cell, input.value)
    }

    input.addEventListener('blur', listener)
  }

  /**
  * Renders cell with the data
  * in the targeted table.
  *
  * @param {HTMLElement} cell
  * @param {string} value?
  */
  renderCell (cell, value = null) {
    const cellValue = value || this.getCellValue(cell)
    const columnKey = this.getCellDataPosition(cell)[1]

    cell.innerHTML = ''
    this.getColumnEditor(columnKey).render(cellValue, cell)
  }

  /**
  * Clears value for the passed cell.
  *
  * @param {HTMLElement} cell
  */
  clearCell (cell) {
    this.writeCellValue(cell, '')
  }

  /**
  * Clears value for the all passed cells.
  * Changes are reflected in the data buffer.
  *
  * @param {HTMLElement[]} cells
  */
  clearCells (cells) {
    // Arrow function should be here to keep the context.
    map((c) => this.clearCell(c), cells)
  }

  /**
  * Adds needed event listeners to the
  * passed cell.
  *
  * @param {HTMLElement} cell
  */
  initCellListeners (cell) {
    // Select Event
    cell.addEventListener('mousedown', () => {
      this.selectCell(cell)
      this.multiSelectingStart = this.getCellAxisPosition(cell)
    })

    // Multi Select Event
    cell.addEventListener('mouseenter', () => {
      if (!this.multiSelectingStart) return
      this.selectCellArea(cell)
    })

    // Edit Event
    cell.addEventListener('dblclick', () => {
      this.editCell(cell)
    })
  }

  /**
  * Saves cell position in the data buffer
  * as attribute in the passed cell node.
  *
  * @param {HTMLElement} cell
  * @param {vector2} [ x, y ] position
  * @param {string} label - head label/key
  */
  assignCellPosition (cell, [ x, y ], label) {
    cell.setAttribute(POSY_ATTR, y)
    cell.setAttribute(POSX_ATTR, x)
    cell.setAttribute(CELLLABEL_ATTR, label)
  }

  /**
  * Subscribes to special input events,
  * such as keyboard interaction and special
  * mouse movements.
  */
  subscribeToEvents () {
    // Multi Selecting
    document.addEventListener('mouseup', () => {
      this.multiSelectingStart = null
    })

    // Delete Cells
    document.addEventListener('keydown', (e) => {
      // TODO: Fix as KeyCode is deprecated
      switch(e.keyCode) {
        case 8:
          // TODO: Fix, should be a proper check if it's an <input />
          if(document.activeElement !== document.body) break
          this.clearCells (this.selectionBuffer)
          break
        default:break
      }
    })
  }
}

////////////////////////////////////////////////////////////////////////////
window.FuzzyTable = FuzzyTable
