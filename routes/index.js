var express = require('express');
var router = express.Router();
import Fees from '../model'

router.post('/fees', async function(req, res, next) {
  const {FeeConfigurationSpec: fcs} = req.body
  const fscArray = fcs.replace(/\*/g, "all").split('\n')
  const sortedFscArray = fscArray.map(res => res.split(' ')).map(result => {
    return {
    feeId: result[0],
      feeCurrency: result[1],
      feeLocale: result[2],
      feeEntity: result[3].split('(')[0],
      entityProperty: result[3].split('(')[1].replace(")", ''),
      feeType: result[6],
      feeValue: result[7]
    }
  })
  await Fees.insertMany(sortedFscArray)
 return res.send(200).json({status: "OK"})
});

router.post('/compute-transaction-fee', async function(req, res, next) {
  const {CurrencyCountry, PaymentEntity, Currency, Amount, Customer} = req.body
  const { Issuer, Type, Country } = PaymentEntity
  const locale = CurrencyCountry === Country ? 'LOCL' : 'INTL'
  const allPossibleFee = await Fees.find({ feeCurrency: {$in: [Currency, 'all']}, feeLocale: {$in: [locale, 'all']}, feeEntity: {$in: [Type, 'all']}, entityProperty: {$in: [Issuer, 'all']} })
  const sortedFscArray = allPossibleFee.map(res => {
    let numberOfUnspecifiedProperty = 0
    if(res.feeLocale === 'all'){
      numberOfUnspecifiedProperty += 1
    }
    if(res.feeCurrency === 'all'){
      numberOfUnspecifiedProperty += 1
    }
    if(res.feeEntity === 'all'){
      numberOfUnspecifiedProperty += 1
    }
    if(res.entityProperty === 'all'){
      numberOfUnspecifiedProperty += 1
    }
    res.numberOfUnspecifiedProperty = 
    numberOfUnspecifiedProperty
    return res
  }).sort((a,b) => (a.numberOfUnspecifiedProperty > b.numberOfUnspecifiedProperty) ? 1 : ((b.numberOfUnspecifiedProperty > a.numberOfUnspecifiedProperty) ? -1 : 0))

  
  if(sortedFscArray.length){
  const {feeId, feeType, feeValue} = sortedFscArray[0]
  const flatpercValue = feeValue.split(':')

  const AppliedFeeValue = feeType === 'FLAT' ? Number(feeValue) : feeType === 'PERC' ? ( Number(feeValue) / 100) * Amount : Number(flatpercValue[0]) + Number(((Number(flatpercValue[1]) / 100) * Amount))
  const ChargeAmount = Customer.BearsFee ? Amount + Math.ceil(AppliedFeeValue) : Amount
  const result = {
    AppliedFeeID: feeId,
    AppliedFeeValue: Math.ceil(AppliedFeeValue),
    ChargeAmount,
    SettlementAmount: ChargeAmount - AppliedFeeValue
  }
 return res.status(200).json(result)
}
return res.status(400).json({
  "Error": "No fee configuration for USD transactions."
}
)
});

module.exports = router;
