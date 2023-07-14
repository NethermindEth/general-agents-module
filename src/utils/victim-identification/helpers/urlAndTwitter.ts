export const getWebsiteAndTwitter = (tag: string, correctProtocols: string[][]) => {
  switch (true) {
    case tag.startsWith("Wrapped Ether") || tag.startsWith("Wrapped BNB"):
      return ["", ""];
    case tag.startsWith("Alameda"):
      return ["https://www.alameda-research.com/", "alamedaresearch"];
    case tag.startsWith("Avalanche"):
      return ["https://www.avax.network/", "avalancheavax"];
    case tag.startsWith("Arbitrum"):
      return ["https://arbitrum.io/", "arbitrum"];
    case tag.startsWith("APE-LP"):
      return ["https://apeswap.finance/", "ape_swap"];
    case tag.startsWith("ApeCoin"):
      return ["https://apecoin.com/", "apecoin"];
    case tag.startsWith("B2BinPay"):
      return ["https://b2binpay.com/en/", "b2binpay"];
    case tag.startsWith("bend"):
      return ["https://www.benddao.xyz/en/", "benddao"];
    case tag.startsWith("BitBase"):
      return ["https://bitbase.es/en/", "BitBase_es"];
    case tag.startsWith("Bibox"):
      return ["https://www.bibox.com/", "Bibox365"];
    case tag.startsWith("Bitkub"):
      return ["https://www.bitkub.com", "bitkubofficial"];
    case tag.startsWith("Bitrue"):
      return ["https://www.bitrue.com/", "BitrueOfficial"];
    case tag.startsWith("Bitstamp"):
      return ["https://www.bitstamp.net/", "Bitstamp"];
    case tag.startsWith("Bittrex"):
      return ["https://global.bittrex.com/", "BittrexGlobal"];
    case tag.startsWith("Boba"):
      return ["https://gateway.boba.network/", "bobanetwork"];
    case tag.startsWith("Blur.io") || tag.startsWith("Blur "):
      return ["https://blur.io/", "blur_io"];
    case tag.startsWith("Brewlabs"):
      return ["https://brewlabs.info/", "TeamBrewlabs"];
    case tag.startsWith("BSW"):
      return ["https://biswap.org/", "Biswap_DEX"];
    case tag.startsWith("BTC 2x Flexible"):
      return ["https://www.indexcoop.com/", "indexcoop"];
    case tag.startsWith("Cake-LP"):
      return ["https://pancakeswap.finance/", "pancakeswap"];
    case tag.startsWith("Celer"):
      return ["https://www.celer.network/", "CelerNetwork"];
    case tag.startsWith("Circle"):
      return ["https://www.circle.com/", "circle"];
    case tag.startsWith("CLEVERMINU"):
      return ["https://www.cleverminu.com/", "cleverminu"];
    case tag.startsWith("Coinbase"):
      return ["https://www.coinbase.com/", "coinbase"];
    case tag.startsWith("Coinex"):
      return ["https://www.coinex.com/", "coinexcom"];
    case tag.startsWith("Coinhako"):
      return ["https://www.coinhako.com/", "coinhako"];
    case tag.startsWith("CoinList"):
      return ["https://coinlist.co/", "coinlist"];
    case tag.startsWith("CoinMetro"):
      return ["https://coinmetro.com/", "Coinmetro"];
    case tag.startsWith("Coinone"):
      return ["https://coinone.co.kr/", "CoinoneOfficial"];
    case tag.startsWith("Coinweb"):
      return ["https://coinweb.io/", "coinwebofficial"];
    case tag.startsWith("Cramer"):
      return ["https://cramercoin.com/", "cramercoin"];
    case tag.startsWith("Crypto Unicorns"):
      return ["https://www.cryptounicorns.fun/", "crypto_unicorns"];
    case tag.startsWith("Crypto Volatility"):
      return ["https://cvi.finance/", "official_CVI"];
    case tag.startsWith("Crypto.com") || tag.startsWith("CRO-"):
      return ["https://crypto.com/", "cryptocom"];
    case tag.startsWith("Devour"):
      return ["https://devourpay.io/", "GoDevour"];
    case tag.startsWith("dQUICK"):
      return ["https://quickswap.exchange/", "QuickswapDEX"];
    case tag.startsWith("DogeTV"):
      return ["https://dogetv.app/", "DogeTvOfficial"];
    case tag.startsWith("DPP"):
      return ["https://dodoex.io/", "BreederDodo"];
    case tag.startsWith("DXdao"):
      return ["https://dxdao.eth.link/", "DXdao_"];
    case tag.startsWith("ELP"):
      return ["https://elk.finance/", "elk_finance"];
    case tag.startsWith("esGF"):
      return ["https://guildfi.com/", "GuildFiGlobal"];
    case tag.startsWith("F2Pool"):
      return ["https://www.f2pool.com/", "F2Pool_Official"];
    case tag.startsWith("fireFBX") || tag.startsWith("Elemental Particles"):
      return ["https://firebot.gg/", "FireBotDAO"];
    case tag.startsWith("FixedFloat"):
      return ["https://fixedfloat.com/", "fixedfloat"];
    case tag.startsWith("Floki Musk"):
      return ["http://www.theflokimusk.com/", "theflokimusk"];
    case tag.startsWith("Foundation"):
      return ["https://foundation.app/", "foundation"];
    case tag.startsWith("FS-V2"):
      return ["https://frax.finance/", "fraxfinance"];
    case tag.startsWith("Gate.io"):
      return ["https://www.gate.io/", "gate_io"];
    case tag.startsWith("Gemini"):
      return ["https://www.gemini.com/", "gemini"];
    case tag.startsWith("GigaSwap"):
      return ["https://gigaswap.app/", "gigaswapfinance"];
    case tag.startsWith("Globe Derivative"):
      return ["https://globe.exchange/", "globedx"];
    case tag.startsWith("Gooeys"):
      return ["https://gooeys.io/", "GooeysP2E"];
    case tag.startsWith("Gopax"):
      return ["https://www.gopax.co.kr/", "gopax_kr"];
    case tag.startsWith("Grove"):
      return ["https://www.grovetoken.com/", "GroveToken"];
    case tag.startsWith("Hellsing Inu"):
      return ["https://hitbtc.com/", "HellsingInu"];
    case tag.startsWith("HitBTC"):
      return ["https://hitbtc.com/", "hitbtc"];
    case tag.startsWith("Hotbit"):
      return ["https://www.hotbit.io/", "Hotbit_news"];
    case tag.startsWith("Idle.finance"):
      return ["https://idle.finance/", "idlefinance"];
    case tag.startsWith("Immutable"):
      return ["https://www.immutable.com/", "Immutable"];
    case tag.startsWith("Jamon-LP"):
      return ["https://jamonswap.finance/", "jamonswap"];
    case tag.startsWith("JLP") || tag.startsWith("LBT"):
      return ["https://traderjoexyz.com/", "traderjoe_xyz"];
    case tag.startsWith("Jump"):
      return ["https://www.jumptrading.com/", "jumptrading"];
    case tag.startsWith("KOROMARU"):
      return ["https://koromaruinu.net/", "KoromaruInu"];
    case tag.startsWith("Kraken"):
      return ["https://www.kraken.com/", "krakenfx"];
    case tag.startsWith("KS2-RT") || tag.startsWith("DMM-LP"):
      return ["https://kyberswap.com/", "KyberNetwork"];
    case tag.startsWith("Kuna.io"):
      return ["https://kuna.io/", "KunaExchange"];
    case tag.startsWith("Layer Zero") || tag.startsWith("LayerZero"):
      return ["https://layerzero.network/", "LayerZero_Labs"];
    case tag.startsWith("MaiCoin"):
      return ["https://www.maicoin.com/", "Max_exch"];
    case tag.startsWith("Metamask"):
      return ["https://metamask.io/", "MetaMask"];
    case tag.startsWith("Metis Andromeda"):
      return ["https://bridge.metis.io/", "MetisDAO"];
    case tag.startsWith("MEXC"):
      return ["https://www.mexc.com/", "MEXC_Global"];
    case tag.startsWith("NFT Index"):
      return ["https://nftindex.tech/", "PRO_BLOCKCHAIN"];
    case tag.startsWith("Nexo"):
      return ["https://nexo.io/", "Nexo"];
    case tag.startsWith("Nouns"):
      return ["https://nouns.wtf/", "nounsdao"];
    case tag.startsWith("OKEx"):
      return ["https://www.okx.com/", "okx"];
    case tag.startsWith("Okidoki Social"):
      return ["https://www.okidokisocial.com/", "okidokisocial"];
    case tag.startsWith("Optics"):
      return ["https://optics.app/", "opticsapp"];
    case tag.startsWith("Optimism"):
      return ["https://www.optimism.io/", "optimismFND"];
    case tag.startsWith("Pancake"):
      return ["https://pancakeswap.finance/", "PancakeSwap"];
    case tag.startsWith("Paribu"):
      return ["https://www.paribu.com/", "paribucom"];
    case tag.startsWith("Peatio"):
      return ["http://www.peatio.com/", "-"];
    case tag.startsWith("PGL"):
      return ["https://www.pangolin.exchange/", "pangolindex"];
    case tag.startsWith("Poloniex"):
      return ["https://poloniex.com/", "Poloniex"];
    case tag.startsWith("Proud Lions"):
      return ["https://proudlionsclub.com/", "proudlionsclub"];
    case tag.startsWith("PUL-LP"):
      return ["https://pulsarswap.com/", "PulsarSwap"];
    case tag.endsWith("WINGS"):
      return ["https://jetswap.finance/", "Jetfuelfinance"];
    case tag.startsWith("Rainbow Token"):
      return ["https://app.halodao.com/", "XaveFinance"];
    case tag.startsWith("Relevant"):
      return ["https://relevant.community/", "relevantfeed"];
    case tag.startsWith("S*"):
      return ["https://stargate.finance/", "StargateFinance"];
    case tag.startsWith("Santiment"):
      return ["https://santiment.net/", "santimentfeed"];
    case tag.startsWith("SHARD"):
      return ["https://shardex.guru/", "shardexof"];
    case tag.startsWith("Shibnobi"):
      return ["https://shibnobi.com/", "Shib_nobi"];
    case tag.startsWith("Shiwa"):
      return ["https://shiwa.finance/", "Shiwa_Finance"];
    case tag.startsWith("SpaceCraft"):
      return ["https://www.acrocalypse.gg/", "acrocalypseNFT"];
    case tag.startsWith("SSwap"):
      return ["https://www.swft.pro/", "SwftCoin"];
    case tag.startsWith("SSLP"):
      return ["https://shibaswap.com/", "ShibaSwapDEX"];
    case tag.startsWith("StarkNet"):
      return ["https://starknet.io/", "StarkWareLtd"];
    case tag.startsWith("stETH"):
      return ["https://lido.fi/", "lidofinance"];
    case tag.startsWith("StrongBlock"):
      return ["https://strongblock.com/", "Strongblock_io"];
    case tag.startsWith("SY-"):
      return ["https://www.pendle.finance/", "pendle_fi"];
    case tag.startsWith("sYOP"):
      return ["https://yopfi.medium.com/", "YOPfi"];
    case tag.startsWith("Tellor"):
      return ["https://tellor.io/", "WeAreTellor"];
    case tag.startsWith("Tether USD (anyUSDT)") || tag.startsWith("anyUSDC"):
      return ["https://multichain.org/", "MultichainOrg"];
    case tag.startsWith("The Sandbox"):
      return ["https://www.sandbox.game/", "TheSandboxGame"];
    case tag.startsWith("THORWallet"):
      return ["https://www.thorwallet.org/", "THORWalletDEX"];
    case tag.startsWith("TNDR"):
      return ["https://tl.games/", "Thunder_Lands_"];
    case tag.startsWith("TWT"):
      return ["https://twitfi.com/", "TwitFi_official"];
    case tag.startsWith("UNI-V2") || tag.startsWith("UNI-V3") || tag.startsWith("Uniswap"):
      return ["https://uniswap.org/", "Uniswap"];
    case tag.startsWith("vEmpire"):
      return ["https://www.v-empire.io/", "vEmpireDDAO"];
    case tag.startsWith("WhiteBIT"):
      return ["https://whitebit.com/", "WhiteBit"];
    case tag.startsWith("Wormhole"):
      return ["https://wormhole.com/", "wormholecrypto"];
    case tag.startsWith("Wintermute"):
      return ["https://www.wintermute.com/", "wintermute_t"];
    case tag.startsWith("World Cup Inu"):
      return ["https://worldcupinu.app/", "wcierc20"];
    case tag.startsWith("WSHARE"):
      return ["https://frozenwalrus.finance/", "walrusfinance"];
    case tag.startsWith("xPollinate"):
      return ["https://bridge.connext.network/", "connextnetwork"];
    case tag.startsWith("XSGD"):
      return ["https://www.straitsx.com/", "straitsx"];
    case tag.startsWith("YouHodler"):
      return ["https://www.youhodler.com/", "youhodler"];
    case tag.startsWith("ZINU"):
      return ["https://wearezinu.com/", "zinutoken"];
    case tag.startsWith("zkSync"):
      return ["https://zksync.io/", "zksync"];
    case tag.endsWith("-f"):
      return ["https://curve.fi/", "curvefinance"];
    case tag === "Pool":
      return ["", ""];
    case correctProtocols.length > 0:
      return [correctProtocols[0][1], correctProtocols[0][2]];
    default:
      return ["", ""];
  }
};
