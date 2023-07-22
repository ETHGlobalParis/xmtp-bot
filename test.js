import { fetchMentionOptions } from "./query.js";

export const checkCollectionExists = (collectionName) => {
	fetchMentionOptions (collectionName, 10).then (([data,error]) => {
		let result = data.SearchAIMentions;
		if (result && result.length > 0) {
			if (result[0].name.toLowerCase() == text.toLowerCase()) {
				return (true, result[0].name)
			} else {
				return (false, result.map (x => x.name).join(", "));
			}
		} else {
			return (false, null);
		}
	});
};

