
import run from '@xmtp/bot-starter'
import { AttachmentCodec, RemoteAttachmentCodec } from '@xmtp/content-type-remote-attachment';
import { Client } from '@xmtp/xmtp-js';
import 'dotenv/config'
import { Wallet, getDefaultProvider } from 'ethers';

process.env.KEY = process.env.GROUPCHAT_KEY|| ""

const userlist = [
	"0xcb0e6F3a6F65c2360bD4324f747859E780bd8FB3",
	"0x93adf1E5180bc2FF3aCe0e9B73236592627e78db",
	"0x5e2C3Ebe2992d1c87A333F1b64F6C9C477c26BCE",
	"0xF7072E5Ff46c6205C42aFD3856c64d83a1d949AB",
	"0x6A03c07F9cB413ce77f398B00C2053BD794Eca1a",
	"0xaE538Eb48b1b66152b56D4698a609C52b3aF1C31",
	"0x60b37A4620ac2F9589DCcc570b20D146b95B5725"
]

console.log("process.env.KEY", process.env.KEY)
const wallet = new Wallet(process.env.KEY);

const client = await Client.create(wallet, { env: 'production' })
client.registerCodec(new AttachmentCodec())
client.registerCodec(new RemoteAttachmentCodec())

const provider = getDefaultProvider('homestead');

run (async (context) => {
	const sender = context.message.senderAddress;
	const messageBody = context.message.content;
	const senderName = await provider.lookupAddress(sender) || sender;
	const withAddress = `${senderName} says : \n${messageBody}`
	if (userlist.includes(sender)) {
		const filterList = userlist.filter((user) => user != sender);
		for (const user of filterList) {
			const convo = await client.conversations.newConversation(user)
			await convo.send(withAddress)
		}

	} else {
		await context.reply(`Sorry, you are not authorized to use this bot`);
	}

})
