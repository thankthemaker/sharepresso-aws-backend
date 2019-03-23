const IOTA = require('iota.lib.js')
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' })

//const remoteCurl = require('@iota/curl-remote')
//remoteCurl(iota, `https://powbox.testnet.iota.org`, 500)

const bundle ="YVLHHOJHLTO9NYLFLNZLNQGUPVSTTCBHTTWLPRXLJGBZVUTKAGFBAJZKHEICFZPIROL9DJIYYPOBWJNQZ"

var bundles = new Set();

var searchVarsBundle = {'bundles':[bundle]}
var message

iota.api.findTransactions(searchVarsBundle, function(error, success) {
        if(error) {
                console.log(error)
                } else{
			iota.api.getBundle(success[0], function(error, success2){
				if(error){console.log(error)}else{
                                        message = success2[0].signatureMessageFragment;
					message = message.split("9").join("");
                           		console.log(iota.utils.fromTrytes(message));
					console.log("-----raw message-----");
                                        console.log(success2[0].signatureMessageFragment);
                                }
                        })
        }
})