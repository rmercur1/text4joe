export const delimiters = {
  startDelimiter: '{',
  endDelimiter: '}'
}

export const delimit = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  return `${startDelimiter}${text}${endDelimiter}`
}

const REQUIRED_UPLOAD_FIELDS = ['firstName', 'lastName', 'cell']
const TOP_LEVEL_UPLOAD_FIELDS = ['firstName', 'lastName', 'cell', 'zip']
const TEXTER_SCRIPT_FIELDS = ['texterFirstName', 'texterLastName']

// TODO: This will include zipCode even if you ddin't upload it
export const allScriptFields = (customFields) => TOP_LEVEL_UPLOAD_FIELDS.concat(TEXTER_SCRIPT_FIELDS).concat(customFields)

const getScriptFieldValue = (contact, texter, fieldName) => {
  let result
  if (fieldName === 'texterFirstName') {
    result = texter.firstName
  } else if (fieldName === 'texterLastName') {
    result = texter.lastName
  } else if (TOP_LEVEL_UPLOAD_FIELDS.indexOf(fieldName) !== -1) {
    result = contact[fieldName]
  } else {
    result = contact.customFields[fieldName]
  }
  return result
}

export const applyScript = ({ script, contact, customFields, texter }) => {
  const scriptFields = allScriptFields(customFields)
  let appliedScript = script
  for (let field of scriptFields) {
    const re = new RegExp(`${delimit(field)}`, 'g')
    appliedScript = appliedScript.replace(re, getScriptFieldValue(contact, texter, field))
  }
  return appliedScript
}
