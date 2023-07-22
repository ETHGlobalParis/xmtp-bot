import { t, StateMachine, ITransition } from "typescript-fsm";
import { AskForCollection, WelcomeMessage } from "./messages.js";
import { GetTokenHoldersByTokenAddress, checkCollectionExists } from "./query.js";
import { sendTokenInfo } from "./sendNFTData.js";

// these are the states and events for the door
enum States { waitingForUser = 0, waitingForNFT, waitingForCollectionName, fetchingCollection};
enum Events { userLogin = 0, sendNFT, sendCollectionName, wrongInput, backToTop, retry};


	const transitions = [
		/* fromState        event                 toState         callback */
		t(States.waitingForUser,    Events.userLogin,        States.waitingForNFT	),
		t(States.waitingForNFT,   Events.wrongInput,  States.waitingForNFT),
		t(States.waitingForNFT,   Events.sendNFT,  States.waitingForCollectionName),
		t(States.waitingForNFT,	Events.backToTop,  States.waitingForNFT),
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
			case States.waitingForNFT:
				if (messageBody == "NFT") {
					await context.reply(AskForCollection)
					return fsm.dispatch(Events.sendNFT);
					}
					await context.reply(`Sorry, I didn't understand that. Please type NFT`);
					return fsm.dispatch(Events.wrongInput);
			case States.waitingForCollectionName :
				if (messageBody == "") {
					return fsm.dispatch(Events.backToTop);
				}
				else {
					const [ matched, indications, error] = await checkCollectionExists(messageBody);
					if (matched) {
						await context.reply(`Fetching tokens for ${indications}`);
						const data = await GetTokenHoldersByTokenAddress(error);
						console.log("data", data)
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

					console.log("fetching collection", context.message.content)
					return fsm.dispatch (Events.sendCollectionName);
				}
			case States.fetchingCollection :
				return ({})
		}
	}
