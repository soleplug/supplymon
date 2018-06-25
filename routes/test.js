const  Nightmare = require('nightmare');
const rp = require('request-promise-native').defaults({
	resolveWithFullResponse: true,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US,en;q=0.8'
	},
	simple: false
});

const confirm = async () => {
var x = await rp.get('http://localhost:3000/vars', {json: true})
console.log(x.body['10'])
}

confirm()