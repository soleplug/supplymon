const  Nightmare = require('nightmare');
const rp = require('request-promise-native').defaults({
	headers:{
		'User-Agent': 'Mozilla/ 5.0(Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/ 537.36',
		'Content-Type': 'application/json'
	},
	resolveWithFullResponse: true,
	followAllRedirects: true,
	simple: false
});

const check = async (keywords, title) => {

    let word
    for(word of keywords) {
        if(title.toLowerCase().includes(word)) { return true}
    }
    return false
}


const uniq = async (a) => {
   return Array.from(new Set(a));
}

const confirm = async (vars) => {

    let p;
    let r;
    let found = false
    let checkout_token
	let proxy_counter = 0; 
	let proxy = monitor_proxies[proxy_counter%monitor_proxies.length]
	let data= { }


	while(true) {

		try {
			r = await rp.post('https://' + access_token + '@' + site + '/api/checkouts.json',{
				proxy: proxy,
				json: data
			})

			checkout_token =  r.body['checkout']['token']

			if(checkout_token) { 
				console.log(new Date().toLocaleTimeString(), "CREATED CHECKOUT SESSION FOR CONFIRMING")
				break; 
			}

			await new Promise(resolve =>  setTimeout(resolve, 1000))

		}
		catch(err) {
			console.log(new Date().toLocaleTimeString(), "FAILED AT CREATING CHECKOUT SESSION FOR CONFIRMING, RETRYING " , err)
			await new Promise(resolve =>  setTimeout(resolve, 1000))
		};

	}


    for(var i=0; i<vars.length; i++) {

		data = {
		  "checkout":{
		    "line_items": [
		      {
		        "variant_id": vars[i],
		        "quantity":"1"
		      }
		    ]
		  }
		}

		try {

			r = await rp.patch('https://' + access_token + '@' + site + '/api/checkouts/' + checkout_token + '.json',{
				proxy: proxy,
				json: data
			})

		
			if(r.statusCode == '200')  {

				p = await check(keywords,r.body['checkout']['line_items'][0]['title'])

				if(p) {
					found = true
					size_dict[r.body['checkout']['line_items'][0]['variant_title']] = vars[i]
				}
								
			}

		}
		catch(err) {}

		proxy_counter = proxy_counter +1
		proxy = monitor_proxies[proxy_counter%monitor_proxies.length]

	}

	if(found) { 
		return true 
	} else { return false }
}

const monitor = async () => {

	if(size_dict['launch']) return

	let old_vars = [];
	let new_vars = [];
	let vars = [];

	let proxy_counter = 0; 
	let proxy = monitor_proxies[proxy_counter%monitor_proxies.length]
	let nightmare;
	let nightmare_proxy;
	let nightmare_username;
	let nightmare_password;


    const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    };

    // SCANNING

    console.log(new Date().toLocaleTimeString(), "SCANNING");

    let re;
    let m;

	while(true) {
			try {

				if(proxy) {
					nightmare_proxy = proxy.split("@")[1]
					nightmare_username = proxy.split("@")[0].split("http://")[1].split(":")[0]
					nightmare_password = proxy.split("@")[0].split("http://")[1].split(":")[1]
					nightmare = Nightmare({switches: {'proxy-server': nightmare_proxy}})

				} else {
					nightmare = Nightmare()
				}

				if(proxy) {

					await nightmare
						.authentication(nightmare_username, nightmare_password)
						.goto(product_url)
						.evaluate( () =>  document.body.innerHTML)
						.then((result) => { 
							
							re = /\d{12,15}/gm;
							
							while (true) {
								m= re.exec(result);
								if(m) {
									new_vars.push(m[0]);
								} else break;
							}

						})

				} else {

					await nightmare
						.goto(product_url)
						.evaluate( () =>  document.body.innerHTML)
						.then((result) => { 
							
							re = /\d{12,15}/gm;
							
							while (true) {
								m= re.exec(result);
								if(m) {
									new_vars.push(m[0]);
								} else break;
							}

						})
				}

				await nightmare.end()

				new_vars = await uniq(new_vars);

				if(new_vars.length > old_vars.length) {
					console.log(new Date().toLocaleTimeString(), "POTENTIAL RELEASE!!! CHECKING IF NEW VARS ARE VALID");
					vars = new_vars.filter( function( el ) {
					  return old_vars.indexOf( el ) < 0;
					});
					size_dict['launch'] = await confirm(vars)
					if(size_dict['launch']) {
						console.log(size_dict)
						return					
					} else {
						console.log(new Date().toLocaleTimeString(), "NOT VALID, THAT WAS A FAKE PUMP OR INITIAL SCAN. SCANNING AGAIN.");
						old_vars = new_vars
						proxy_counter = proxy_counter +1;
						proxy = monitor_proxies[proxy_counter%monitor_proxies.length]
						new_vars = []

					}

				} else {
					console.log(new Date().toLocaleTimeString(), "SCANNING " , proxy);
					proxy_counter = proxy_counter +1;
					proxy = monitor_proxies[proxy_counter%monitor_proxies.length]
					new_vars = []
				}
				
			} catch (err) {
		        console.log(new Date().toLocaleTimeString(), "ERR IN NIGHTMARE CONNECTION");
		        await nightmare.end()
		        continue
			}
		}


};

let shopify = {
	'yeezysupply.com': 	{'access_token' : 'afa13d942580749aa2985b086cc0bdcb', 'unique_token' : '117647559'}
}

let site = 'yeezysupply.com'

let access_token = shopify[site]['access_token']
let unique_token = shopify[site]['unique_token']

let monitor_proxies = ['http://Soleplug:312468Bh@172.98.167.128:24794',
					'http://Soleplug:312468Bh@172.98.167.179:24794',
					'http://Soleplug:312468Bh@172.98.167.183:24794',
					'http://Soleplug:312468Bh@172.98.167.187:24794',
					'http://Soleplug:312468Bh@172.98.167.191:24794',
					'http://Soleplug:312468Bh@172.98.167.193:24794',
					'http://Soleplug:312468Bh@172.98.167.195:24794',
					'http://Soleplug:312468Bh@172.98.167.197:24794',
					'http://Soleplug:312468Bh@172.98.167.199:24794',
					'http://Soleplug:312468Bh@172.98.167.201:24794',
					'http://Soleplug:312468Bh@172.98.167.203:24794',
					'http://Soleplug:312468Bh@172.98.167.205:24794',
					'http://Soleplug:312468Bh@172.98.167.207:24794',
					'http://Soleplug:312468Bh@172.98.167.209:24794',
					'http://Soleplug:312468Bh@172.98.167.52:24794',
					'http://Soleplug:312468Bh@172.98.167.54:24794',
					'http://Soleplug:312468Bh@172.98.167.99:24794']

let keywords = ['yeezy' , 'butter']

//let product_url = 'https://yeezysupply.com/products/yeezy-500-super-moon-yellow-1'
//let product_url = 'https://yeezysupply.com/products/mens-desert-boot-in-thick-suede-mesh-and-nubuck-graphite'
let product_url = 'https://yeezysupply.com'


// FOR RESTOCK, PASTE THE VARS AND SET LAUNCH TO TRUE
// FOR RELEASE, SET DICT = {} AND LAUNCH FALSE

let size_dict = {'launch' : false }



let scanning = false 
var routes = function (app) {
  app.get("/scan", function(req, res) {
    if(!scanning) {
    	res.status(200).send("Started scanning");
	    monitor()
	    scanning = true
	} else res.status(200).send("Already scanning");

  });

  app.get("/test", function(req, res) {
  	let test = {"39":"1351586840595","40":"1351586873363","41":"1351586906131","42":"1351586938899","43":"1351586971667","launch":true}
	res.status(200).send(test);
  });

  app.get("/vars", function(req, res) {
	res.status(200).send(size_dict);
  });

}



module.exports = routes;