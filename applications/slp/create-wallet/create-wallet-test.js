/*
  Create an HDNode wallet using bch-js. The mnemonic from this wallet
  will be used by later examples.
*/

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://localhost:3000/v3/'

const WALLET_NAME = `wallet-info-${NETWORK}-pat2`
console.log('WALLET_NAME', WALLET_NAME)

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
    var CASHADDR_REGTEST_P2SH_ADDRESSES = [
      'bchreg:pph5kuz78czq00e3t85ugpgd7xmer5kr7caz4mtx33',
      'bchreg:ppxenfpcf975gxdjmq9pk3xm6hjmfj6re5nq4xku0u',
      'bchreg:pzfau6vrq980qntgp5e7l6cpfsf7jw88c544twj8ea',
      'bchreg:pzcguejjfxld867ck4zudc9a6y8mf6ftgqfgft0uqs',
      'bchreg:pqm2lpqdfjsg8kkhwk0a3e3gypyswkd69u2ctvr4pg',
      'bchreg:prccfa4qm3xfcrta78v7du75jjaww0ylnselu0kr6h',
      'bchreg:pqdcsl6c879esyxyacmz7g6vtzwjjwtzns93m0u9v9',
      'bchreg:ppr2ddwe8qnnh8h20mmn4zgrharmy0vuy5d782p0qd',
      'bchreg:pqymsmh0nhfhs9k5whhnjwfxyaumvtxm8grfqenw6r',
      'bchreg:pzwdmm83qjx7372wxgszaukan73ffn8ct5u847kkjc',
      'bchreg:pzh3f9me5z5sn2w8euap2gyrp6kr7gf6myascmlr9h',
      'bchreg:prneuckcx69clprn4nnr82tf8sycqrs3acuqvwaq9w',
      'bchreg:pz742xef07g9w8q52mx0q6m9hp05hnzm65h90yflxd',
      'bchreg:pq5dzl0drx8v0layyyuh5aupvxfs80ydmsgl6undcg',
      'bchreg:ppxedxtug7kpwd6tgf5vx08gjamel7slds37qjq73q',
      'bchreg:pr4fs2m8tjmw54r2aqmadggzuagttkujgy2elate9z',
      'bchreg:prmed4fxlhkgay9nxw7zn9muew5ktkyjnu4kp9zla7',
      'bchreg:pqv3cpvmu4h0vqa6aly0urec7kwtuhe49yt3khrd4t',
      'bchreg:pr39scfteeu5l573lzerchh6wc4cqkxetu2kxt03fz',
      'bchreg:pzzjgw37vwls805c9fw6g9vqyupadst6wgjkusfh2c'
    ]
    // Generate the first 10 seed addresses.
    for (let i = 0; i < 20; i++) {
      const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/${i}`)
      const cashAddress = bchjs.HDNode.toCashAddress(childNode, regtest)

      console.log(
        `m/44'/145'/0'/0/${i}: ${CASHADDR_REGTEST_P2SH_ADDRESSES[i]}`
      )
      // outStr += `m/44'/145'/0'/0/${i}: ${cashAddress}\n`
      outStr += bchjs.HDNode.toLegacyAddress(childNode, true, true)
      // outStr += bchjs.SLP.Address.toSLPAddress(CASHADDR_REGTEST_P2SH_ADDRESSES[i], true, regtest)
      outStr += '\n'
      // Save the first seed address for use in the .json output file.
      if (i === 0) {
        outObj.cashAddress = cashAddress
        outObj.legacyAddress = bchjs.HDNode.toLegacyAddress(childNode, true)
        outObj.slpAddress = bchjs.SLP.Address.toSLPAddress(outObj.cashAddress, true, regtest)
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
