import { NButton } from 'naive-ui'
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'

import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

import { RESTManager } from '~/utils'

export default defineComponent({
  setup() {
    return () => {
      return (
        <>
          <NButton
            onClick={async () => {
              const registrationOptions =
                await RESTManager.api.passkey.register.post<any>()
              let attResp: RegistrationResponseJSON
              try {
                // Pass the options to the authenticator and wait for a response
                attResp = await startRegistration(registrationOptions)
              } catch (error: any) {
                // Some basic error handling
                if (error.name === 'InvalidStateError') {
                  message.error(
                    'Error: Authenticator was probably already registered by user',
                  )
                } else {
                  message.error(error.message)
                }
              }

              try {
                Object.assign(attResp, {
                  name: `test-1${(Math.random() * 100) | 0}`,
                })
                const verificationResp =
                  await RESTManager.api.passkey.register.verify.post<any>({
                    data: attResp,
                  })
                if (verificationResp.verified) {
                  message.success('Successfully registered authenticator')
                } else {
                  message.error('Error: Could not verify authenticator')
                }
              } catch {
                message.error('Error: Could not verify authenticator')
              }
            }}
          >
            Register
          </NButton>

          <NButton
            onClick={async () => {
              const registrationOptions =
                await RESTManager.api.passkey.authentication.post<any>()
              let attResp: AuthenticationResponseJSON
              try {
                // Pass the options to the authenticator and wait for a response
                attResp = await startAuthentication(registrationOptions)
              } catch (error: any) {
                // Some basic error handling

                message.error(error.message)
              }

              try {
                const verificationResp =
                  await RESTManager.api.passkey.authentication.verify.post<any>(
                    {
                      data: attResp,
                    },
                  )
                if (verificationResp.verified) {
                  message.success('Successfully registered authenticator')
                } else {
                  message.error('Error: Could not verify authenticator')
                }
              } catch (error: any) {
                message.error(error.message)
              }
            }}
          >
            Authenticator
          </NButton>
        </>
      )
    }
  },
})
