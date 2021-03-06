import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { getFormattedPhoneNumber } from '../lib/phone-format'
import { r, UserCell } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'

const PER_ASSIGNED_NUMBER_MESSAGE_COUNT = 250
const ACTIVE_SMS_SERVICE = 'twilio'

const serviceMap = { nexmo, twilio }

async function assignUserNumbers() {
  const unassignedMessages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .filter({ user_number: '' })
  for (let index = 0; index < unassignedMessages.length; index++) {
    const message = unassignedMessages[index]
    let userNumber

    // always use already used cell in a thread with a user.
    const lastMessage = await r.table('message')
      .getAll(message.assignment_id, { index: 'assignment_id' })
      .filter({ contact_number: message.contact_number })
      .filter((doc) => doc('user_number').ne(''))
      .limit(1)(0)
      .default(null)

    // Assign service
    let service = null
    if (lastMessage) {
      service = lastMessage.service
    } else {
      service = ACTIVE_SMS_SERVICE
    }
    log.info(`Choosing service ${service} for message ID ${message.id}`)

    const assignment = await r.table('assignment')
      .get(message.assignment_id)

    const userId = assignment.user_id

    let userCell = await r.table('user_cell')
      .getAll(userId, { index: 'user_id' })
      .filter({
        service,
        is_primary: true
      })
      .limit(1)(0)
      .default(null)

    if (!userCell) {
      log.info(`Renting new cell for user ID ${userId} from service: ${service}`)
      const newCell = await serviceMap[service].rentNewCell()

      userCell = new UserCell({
        cell: getFormattedPhoneNumber(newCell),
        user_id: userId,
        is_primary: true,
        service
      })

      await userCell.save()
    }

    if (lastMessage) {
      userNumber = lastMessage.user_number
    } else {
      userNumber = userCell.cell
    }

    log.info(`Assigning ${userNumber} (${service}) to message ${message.id}`)
    await r.table('message')
      .get(message.id)
      .update({
        user_number: userNumber,
        service
      })

    // Cycle cell when necessary
    const messageCount = await r.table('message')
      .getAll(userCell.cell, { index: 'user_number' })
      .filter({ service })
      .count()

    if (messageCount >= PER_ASSIGNED_NUMBER_MESSAGE_COUNT) {
      await r.table('user_cell')
        .get(userCell.id)
        .update({ is_primary: false })
    }
  }
}

(async () => {
  while (true) {
    try {
      await sleep(500)
      await assignUserNumbers()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
