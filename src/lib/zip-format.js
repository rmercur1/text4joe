export const getFormattedZip = (zip, country = 'US') => {
  if (country === 'US') {
    const regex = /(\d{5})([ \-]\d{4})?/
    let [, first5] = zip.match(regex) || []

    return first5
  } else {
    throw new Error(`Don't know how to format zip for country: ${country}`)
  }
}
