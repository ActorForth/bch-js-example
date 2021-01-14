/*
  Create an HDNode wallet using bch-js. The mnemonic from this wallet
  will be used by later examples.
*/

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'mainnet'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://localhost:3000/v3/'

const WALLET_NAME = `wallet-info-${NETWORK}2`

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('bch-js-reg')

// Instantiate bch-js based on the network.
let bchjs
let regtest
switch (NETWORK) {
  case 'mainnet':
    bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
    regtest = false
    break
  case 'testnet':
    bchjs = new BCHJS({ restURL: TESTNET_API_FREE })
    regtest = false
    break
  case 'regtest':
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
    break
  default:
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    regtest = true
}

const fs = require('fs')

const lang = 'english' // Set the language of the wallet.

// These objects used for writing wallet information out to a file.
let outStr = ''
const outObj = {}

async function createWallet () {
  try {
    // create 256 bit BIP39 mnemonic
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
    console.log('ROOTSEED', rootSeed)

    // master HDNode
    const masterHDNode = bchjs.HDNode.fromSeed(rootSeed, NETWORK)

    // HDNode of BIP44 account
    console.log('BIP44 Account: "m/44\'/145\'/0\'"')
    outStr += 'BIP44 Account: "m/44\'/145\'/0\'"\n'

    // Generate the first 10 seed addresses.
    for (let i = 0; i < 10; i++) {
      const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/${i}`)
      const cashAddress = bchjs.HDNode.toCashAddress(childNode, regtest)

      console.log(
        `m/44'/145'/0'/0/${i}: ${cashAddress}`
      )
      outStr += `m/44'/145'/0'/0/${i}: ${cashAddress}\n`

      // Save the first seed address for use in the .json output file.
      if (i === 0) {
        outObj.cashAddress = cashAddress
        outObj.legacyAddress = bchjs.HDNode.toLegacyAddress(childNode, true)
        outObj.slpAddress = bchjs.SLP.Address.toSLPAddress(outObj.cashAddress, true, true)
        outObj.WIF = bchjs.HDNode.toWIF(childNode)
      }
    }

    // Write the extended wallet information into a text file.
    fs.writeFile(`${WALLET_NAME}.txt`, outStr, function (err) {
      if (err) return console.error(err)
      console.log(`${WALLET_NAME}.txt written successfully.`)
    })

    // Write out the basic information into a json file for other example apps to use.
    fs.writeFile(`${WALLET_NAME}.json`, JSON.stringify(outObj, null, 2), function (err) {
      if (err) return console.error(err)
      console.log(`${WALLET_NAME}.json written successfully.`)
    })
  } catch (err) {
    console.error('Error in createWallet(): ', err)
  }
}
createWallet()
