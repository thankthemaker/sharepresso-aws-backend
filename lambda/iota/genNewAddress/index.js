// Require the use of IOTA library
const IOTA = require("iota.lib.js")
//
 // Create a new instance of the IOTA class object. 
// // Use 'provider' variable to specify which Full Node to talk to
const iota = new IOTA({provider: "https://nodes.devnet.iota.org:443"})

//Following two lines outsource the PoW to the powbox -< its not workinconst 
//const remoteCurl = require("@iota/curl-remote")
//remoteCurl(iota, "https://powbox.testnet.iota.org")

const seed ="ZEA99C9MNKHYFUPUMQGTGIJLBJTXAEJWXFFPGWPMRRWGRGOZPNJ9GQIOSIQB9EKPONNXQIHRCGSREUBDN"

iota.api.getNewAddress (seed,  (error, success) => {
	if(error){
		console.log(error)
	}else {
		console.log(success)
	}
})
