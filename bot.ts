import run from '@xmtp/bot-starter'

//npm run bot
//@ts-ignore
import qrcode from 'qrcode-terminal'
import { dispatch } from './fsm.js';
import HandlerContext from '@xmtp/bot-starter/dist/HandlerContext.js';
import 'dotenv/config'




run(async (context : HandlerContext) => {
  // When someone sends your bot a message, you can get the DecodedMessage
  // from the HandlerContext's `message` field
  console.log("dispatching...")
  await dispatch (context);
  console.log("dispatched")




  // To reply, just call `reply` on the HandlerContext.
}).catch((err) => {
  console.error(err);
});
