const MAX_IMAGE_SIDE = 1280
const TARGET_DATA_URL_LENGTH = 900_000
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52]

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Не удалось прочитать изображение'))
    }

    reader.onerror = () => {
      reject(reader.error || new Error('Не удалось прочитать изображение'))
    }

    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Не удалось загрузить изображение'))
    image.src = dataUrl
  })
}

function getScaledDimensions(width: number, height: number) {
  if (width <= MAX_IMAGE_SIDE && height <= MAX_IMAGE_SIDE) {
    return { width, height }
  }

  const scale = Math.min(MAX_IMAGE_SIDE / width, MAX_IMAGE_SIDE / height)

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export default async function processImageFile(file: File) {
  const sourceDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const { width, height } = getScaledDimensions(image.width, image.height)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Не удалось подготовить изображение')

  context.drawImage(image, 0, 0, width, height)

  let bestDataUrl = canvas.toDataURL('image/jpeg', QUALITY_STEPS[0])

  for (const quality of QUALITY_STEPS) {
    const nextDataUrl = canvas.toDataURL('image/jpeg', quality)
    bestDataUrl = nextDataUrl

    if (nextDataUrl.length <= TARGET_DATA_URL_LENGTH) {
      break
    }
  }

  return bestDataUrl
}
