/*
  Create an HDNode wallet using bch-js. The mnemonic from this wallet
  will be used in the other examples.
*/

// Set NETWORK to either testnet or mainnet
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'http://localhost:3000/v3/'
// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('bch-js-reg')

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })

const fs = require('fs')

async function createWallet () {
  const lang = 'english'
  let outStr = ''
  const outObj = {}

  // create 128 bit BIP39 mnemonic
  const mnemonic = bchjs.Mnemonic.generate(
    128,
    bchjs.Mnemonic.wordLists()[lang]
  )
  console.log('BIP44 $BCH Wallet')
  outStr += 'BIP44 $BCH Wallet\n'
  console.log(`128 bit ${lang} BIP39 Mnemonic: `, mnemonic)
  outStr += `\n128 bit ${lang} BIP32 Mnemonic:\n${mnemonic}\n\n`
  outObj.mnemonic = mnemonic

  // root seed buffer
  const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic)

  // master HDNode
  let masterHDNode
  if (NETWORK === 'mainnet') masterHDNode = bchjs.HDNode.fromSeed(rootSeed)
  else masterHDNode = bchjs.HDNode.fromSeed(rootSeed, 'regtest') // Testnet

  // HDNode of BIP44 account
  const account = bchjs.HDNode.derivePath(masterHDNode, "m/44'/245'/0'")
  console.log('BIP44 Account: "m/44\'/245\'/0\'"')
  outStr += 'BIP44 Account: "m/44\'/245\'/0\'"\n'

  for (let i = 0; i < 10; i++) {
    const childNode = masterHDNode.derivePath(`m/44'/245'/0'/0/${i}`)
    console.log(
      `m/44'/245'/0'/0/${i}: ${bchjs.HDNode.toCashAddress(childNode, true)}`
    )
    outStr += `m/44'/245'/0'/0/${i}: ${bchjs.HDNode.toCashAddress(childNode, true)}\n`

    if (i === 0) {
      outObj.cashAddress = bchjs.HDNode.toCashAddress(childNode, true)
      console.log('OUTOBJ.CASHADDRESS', outObj.cashAddress)
      outObj.slpAddress = bchjs.SLP.Address.toSLPAddress(outObj.cashAddress, true, true)
      outObj.legacyAddress = bchjs.Address.toLegacyAddress(outObj.cashAddress, true)
    }
    console.log('OUTOBJ.SLPADDRESS', outObj.slpAddress)

  }

  // derive the first external change address HDNode which is going to spend utxo
  const change = bchjs.HDNode.derivePath(account, '0/0')

  // get the cash address
  bchjs.HDNode.toCashAddress(change, true)

  // Get the legacy address.

  outStr += '\n\n\n'
  fs.writeFile('wallet-info-2.txt', outStr, function (err) {
    if (err) return console.error(err)

    console.log('wallet-info-2.txt written successfully.')
  })

  // Write out the basic information into a json file for other apps to use.
  fs.writeFile('wallet.json-2', JSON.stringify(outObj, null, 2), function (err) {
    if (err) return console.error(err)
    console.log('wallet-2.json written successfully.')
  })
}
createWallet()
