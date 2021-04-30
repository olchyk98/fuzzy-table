function generateData () {
  return R.times(() => ({
    name: Math.random().toString(),
    position: Math.random().toString(),
    country: Math.random().toString(),
    slug: Math.random().toString(),
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAWlBMVEX///8AI5XtKTntJzcAIZS1vNwLMJy4wN35wcXuNUX5vsJBVKr719nwWGPtIzTQ1uoAHJPuMEDv8fjX3O7+7/H83+HByONQZLL6yc3yanTxYWwAKZoAGZJIXbCCdoh+AAABGklEQVR4nO3dyRGCABBEURXcd0DALf80veBZreqL+n4AXfMimNFIkiRJkiRJkiRJkiRJ+qRqn6muQgc1p02mZhhs7+tIXRsS9udtpEs/DE6vt0Og23UeEi6Ou0jH1VM4K8eByllMuCwmgYolISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIeFXCX/+t3p7f/H4/s26NiTszy8e37/ZpR8Gq32mugoJm9MmUxM6SJIkSZIkSZIkSZIkSf/SA0zHySuCYw5NAAAAAElFTkSuQmCC',
  }), 1000)
}

const testingData = generateData()

const target = document.querySelector(".container")

new window.FuzzyTable({
  target,
  columns: [ 'name', 'position', 'country', 'slug', 'image' ],
  data: testingData,
  columnProperties: [
    null,
    null,
    null,
    null,
    new window.FlagEditor(),
    //{
      //// the whole spec can be abstracted,
      //// so that only editor arguments
      //// would be specified -> PLUGINS!
      //render: (value, cell) => {
        //const imgTag = document.createElement('img')
        //imgTag.src = value
        //cell.appendChild(imgTag)
      //}
    //}
  ]
})
