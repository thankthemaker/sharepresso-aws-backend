const IOTA = require('iota.lib.js')
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' })

//const remoteCurl = require('@iota/curl-remote')
//remoteCurl(iota, "https://powbox.testnet.iota.org", 500)

/*iota.api.getNodeInfo((error, success) => {
            if (error) {
                            console.log(error)
                        } else {
                                        console.log(success)
                                    }
})*/

const seed = "ZEA99C9MNKHYFUPUMQGTGIJLBJTXAEJWXFFPGWPMRRWGRGOZPNJ9GQIOSIQB9EKPONNXQIHRCGSREUBDN"

const message = iota.utils.toTrytes("1i from Coffeemaker")

address = "HELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDD"

const transfers = [
    {
        value: 1,
        address: address,
        message: message
    }]

iota.api.sendTransfer(seed, 3, 9, transfers, (error, success) => {
    if (error) {
        console.log(error)
    } else {
        console.log(success)
    }
})