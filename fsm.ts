import { t, StateMachine, ITransition } from "typescript-fsm";
import { AskForCollection, AskForEvent, WelcomeMessage } from "./messages.js";
import { GetPOAPEvent, GetTokenHoldersByTokenAddress, checkCollectionExists, checkPoapEventExistence, getPoapEventInfo } from "./query.js";
import { sendImage, sendTokenInfo } from "./sendNFTData.js";

// these are the states and events for the door
enum States { waitingForUser = 0, waitingFirstInput, waitingForCollectionName, waitingForEventName, fetchingCollection, waitingForGroupChatConfirmation};
enum Events { userLogin = 100, sendNFT, sendPOAP, sendCollectionName, wrongInput, backToTop, retry, proposeGroupChat };


	const transitions = [
		/* fromState        event                 toState         callback */
		t(States.waitingForUser,    Events.userLogin,        States.waitingFirstInput	),
		t(States.waitingFirstInput,   Events.wrongInput,  States.waitingFirstInput),
		t(States.waitingFirstInput,   Events.sendNFT,  States.waitingForCollectionName),
		t(States.waitingFirstInput,   Events.sendPOAP,  States.waitingForEventName),
		t(States.waitingFirstInput,	Events.backToTop,  States.waitingFirstInput),
		t(States.waitingForEventName,   Events.retry,  States.waitingForEventName),
		t(States.waitingForEventName,   Events.backToTop,  States.waitingForUser),
		t(States.waitingForEventName,  Events.proposeGroupChat,  States.waitingForGroupChatConfirmation),
		t(States.waitingForGroupChatConfirmation,   Events.retry,  States.waitingForGroupChatConfirmation),
		t(States.waitingForGroupChatConfirmation,   Events.backToTop,  States.waitingForUser),
		t(States.waitingForCollectionName,   Events.retry,  States.waitingForCollectionName),
		t(States.waitingForCollectionName,   Events.sendCollectionName,  States.fetchingCollection),
		t(States.waitingForCollectionName,	Events.backToTop,  States.waitingForUser),
	];

	const fsm = new StateMachine<States, Events>(
   States.waitingForUser,   // initial state
   transitions ,     // array of transitions
	);



	const onWrongCollectionNameInput = (context : any) => async () => {
		await context.reply(`Sorry, I didn't understand that. Please type the name of the collection you are looking for`);
		const messageBody = context.message.content;
		if (messageBody == "") {
			return fsm.dispatch (Events.backToTop);
		}
		else {
			return fsm.dispatch(Events.sendCollectionName);
		}
	}

	const onCollectionNameInput =  async (context : any) => {
	}


	export const dispatch =  async (context : any) => {
		const messageBody = context.message.content;
		const state = fsm.getState();
		console.log("state", state)
		switch(state) {
			case States.waitingForUser:
				console.log("waitingForUser")
				await context.reply(WelcomeMessage);
				return fsm.dispatch(Events.userLogin);
			case States.waitingFirstInput:
				if (messageBody.toUpperCase() == "NFT") {
					await context.reply(AskForCollection)
					return fsm.dispatch(Events.sendNFT);
					}
				else if (messageBody.toUpperCase() == "EVENT") {
					await context.reply(AskForEvent);
					return fsm.dispatch(Events.sendPOAP);
				}
				else {
					await context.reply(`Sorry, I didn't understand that. Please type NFT`);
					return fsm.dispatch(Events.wrongInput);
				}
			case States.waitingForEventName :
				if (messageBody == "") {
					return fsm.dispatch(Events.backToTop);
				}
				const eventExist = await checkPoapEventExistence(messageBody);
				if (eventExist) {
					await context.reply(`Fetching data for event ${messageBody}`);
					const data = await getPoapEventInfo(messageBody);

					const poapEvent = data.PoapEvents.PoapEvent[0];
					// await context.reply(`Found ${JSON.stringify(data)}`);
					await sendImage(context, poapEvent.contentValue.image.original);
					await context.reply(`${poapEvent.eventName} was a great event \n \
					it took place in ${poapEvent.city},${poapEvent.country} \n
						from ${poapEvent.startDate} to ${poapEvent.endDate} \n`);
					await context.reply(`I found ${poapEvent.poaps.length} attendees. \n
					Would you like to start a group chat with them ?`)
					return fsm.dispatch (Events.proposeGroupChat);
				}
				await context.reply(`Sorry, I couldn't find any event similar ${messageBody}. Please try again with the exact name`);
				return fsm.dispatch (Events.retry);
			case States.waitingForCollectionName :
				if (messageBody == "") {
					return fsm.dispatch(Events.backToTop);
				}
				else {
					const [ matched, indications, error] = await checkCollectionExists(messageBody);
					if (matched) {
						await context.reply(`Fetching tokens for ${indications}`);
						const data = await GetTokenHoldersByTokenAddress(error);

						await sendTokenInfo(context, data);
						await context.reply(`Going to sleep now. Send me a message to wake me up!`);
						fsm.dispatch (Events.backToTop);
					} else {
						if (error) {
							await context.reply(`Sorry, something went wrong. Please try again`);
							return fsm.dispatch (Events.backToTop);
						}
						if (indications) {
							await context.reply(`Sorry, I couldn't find any collection similar to ${messageBody}. Did you mean any of ${indications}? Please try again`);
							return fsm.dispatch (Events.retry);
						}
						else {
							await context.reply(`Sorry, I couldn't find any collection similar to ${messageBody}. Please try again`);
							return fsm.dispatch (Events.retry);
						}
					}
				}
			case States.waitingForGroupChatConfirmation :
				if (messageBody.toUpperCase() == "YES" || messageBody.toUpperCase() == "Y") {
					await context.reply(`Great! I will start a group chat with the attendees of this event`);
					await context.reply(`group chat started at 0x00Fc7E2a7A4B2D5A9D7d70c5EbD1b40c2f3742d3. join them now!`)
					await context.reply(`Going to sleep now, Send me a message to wake me up!`);
					return fsm.dispatch (Events.backToTop);
				}
				else if (messageBody.toUpperCase() == "NO" || messageBody.toUpperCase() == "N") {
					await context.reply(`Ok, I will go to sleep now.`);
					return fsm.dispatch (Events.backToTop);
				}
				else {
					await context.reply(`Sorry, I didn't understand that. Please type YES or NO`);
					return fsm.dispatch (Events.retry);
				}

			case States.fetchingCollection :
				return ({})
		}
	}
