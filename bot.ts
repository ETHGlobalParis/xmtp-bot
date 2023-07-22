import run from '@xmtp/bot-starter'

//npm run bot
//@ts-ignore
import qrcode from 'qrcode-terminal'
import { dispatch } from './fsm.js';
import HandlerContext from '@xmtp/bot-starter/dist/HandlerContext.js';

process.env.KEY = "464faef01d67d4124510cfb32aae7950899478208b90f56f2aae3da5806b9a5d"



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
