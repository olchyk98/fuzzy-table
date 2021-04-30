class FlagEditor {
  constructor () {
    this.fetchedFlags = []
    this.isLoading = false
  }

  async onInit () {
    this.isLoading = true
    this.fetchedFlags = await new Promise((res) => setTimeout(res, 1000, [ { key: "ABC", value: "$$$" } ]))
    this.isLoading = false
  }

  render (cell, value) {
    const k = this.fetchedFlags.find(i => i.key === value)
    cell.textContent = k?.value || ''
  }
}

window.FlagEditor = FlagEditor
