/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */
/* global fetch */
const urlService = "https://api.woleet.io/v1/anchor";
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYzZmZTMzMi0wODNjLTRjZmMtYmYxNC0xNWU5MTJmMWY4OWIiLCJpYXQiOjE1NzYxNzQzNDV9.n31j9ctJj7R1Vjwyc5yd1d6Cmg0NDnpwSaLWsqtZJQA";
export {
	anchor
};
async function anchor(hash, userKey) {
	let bearer = userKey || apiKey;
	const response = await fetch(urlService, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
			"Authorization": "Bearer " + bearer
		},
		body: JSON.stringify({
			"name": hash,
			"hash": hash,
			"public": true
		})
	});
	if (response.status == 401) {
		const error = new Error("Your access token on Woleet is invalid. Go to __DOC_LINK__ to create your account.");
		error.link = "https://app.woleet.io/";
		throw error;
	} else if (response.status == 402) {
		const error = new Error("You have no more credits on Woleet. Go to __DOC_LINK__ to recharge them.");
		error.link = "https://app.woleet.io/";
		throw error;
	} else if (response.status >= 400) {
		throw new Error((response.statusText || ("Error " + response.status)) + " (Woleet)");
	}
	return response.json();
}