// Require the use of IOTA library
const IOTA = require("iota.lib.js")

// Create a new instance of the IOTA class object. 
// Use 'provider' variable to specify which Full Node to talk to
const iota = new IOTA({provider: "https://nodes.devnet.iota.org:443"})

//Following two lines outsource the PoW to the powbox -< its not workinconst 
//const remoteCurl = require("@iota/curl-remote")
//remoteCurl(iota, "https://powbox.testnet.iota.org", 500, ")

const seed="ZEA99C9MNKHYFUPUMQGTGIJLBJTXAEJWXFFPGWPMRRWGRGOZPNJ9GQIOSIQB9EKPONNXQIHRCGSREUBDN"

var addresses = new Set()
var allAddresses

iota.api.getNewAddress(seed, {'returnAll':true}, function(error, allAddresses) {
	if(error) {
                console.log(error)
        } else {
                allAddresses.forEach(function(addr) { addresses.add(addr)})
                console.log(allAddresses)
                iota.api.getBalances(allAddresses, 10, function(error, success) {
                        if(error) {
                                console.log(error)
                        }else {
                                console.log(success)
                     }
                })
        }
})