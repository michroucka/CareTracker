export const unitTypeTranslations = {
    "HOUR": "min",
    "OCCURRENCE": "úkon",
    "KM": "km",
    "KG": "kg",
}

/** Half-up division of non-negative integers, exact as long as the numbers stay integers. */
const divideRoundingHalfUp = (dividend, divisor) => Math.floor((2 * dividend + divisor) / (2 * divisor));

/**
 * Same result as the backend (PerformedTask.calculatePrice, BigDecimal HALF_UP). The amount has at most
 * two decimals, so it is counted in hundredths: in floating point 0.29 * 50 is 14.4999… and would round down.
 */
export const calculatePrice = (task, unitCount) => {
    if (!task) return 0;
    const amountInHundredths = Math.round(unitCount * 100) * task.unitPrice;
    const hundredthsPerPricedUnit = task.unitType === "HOUR" ? 60 * 100 : 100;
    return divideRoundingHalfUp(amountInHundredths, hundredthsPerPricedUnit);
}