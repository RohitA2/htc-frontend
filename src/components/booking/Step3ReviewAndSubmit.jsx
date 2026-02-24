import React from 'react';

const Step3ReviewAndSubmit = ({ formData, calculations = {} }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const safeFixed = (value, digits = 2) => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(digits);
  };

  const getStatusBadge = (amount) => {
    const num = Number(amount);
    if (num === 0) return <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Paid</span>;
    if (num > 0) return <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Pending ₹{safeFixed(num)}</span>;
    return <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">N/A</span>;
  };

  const commissionTypeLabel = () => {
    switch (formData.commissionType) {
      case 'party': return 'From Party (Deducted)';
      case 'truck': return 'From Truck Owner/Driver';
      case 'bank': return 'Bank / Other';
      case 'free': return 'Free / No Commission';
      default: return 'Not Specified';
    }
  };

  const isTruckCommission = formData.commissionType === 'truck';

  // Calculate simplified amounts
  const partyFreight = Number(calculations.partyFreight) || 0;
  const truckFreight = Number(calculations.truckFreight) || 0;
  const commissionAmount = Number(calculations.commissionAmount) || 0;
  const initialPaymentFromParty = Number(formData.initialPaymentFromParty) || 0;
  const initialPaymentToTruck = Number(formData.initialPaymentToTruck) || 0;

  const partyReceivable = partyFreight - initialPaymentFromParty;
  const truckPayable = truckFreight - (isTruckCommission ? commissionAmount : 0) - initialPaymentToTruck;
  const netBalance = partyReceivable - truckPayable;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Booking Summary */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 text-white">
          <h3 className="text-xl font-semibold">Booking Summary</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium">{formatDate(formData.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {formData.bookingType || '—'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Slip No</p>
                <p className="font-medium">{formData.bookingSlipNo || 'Not Provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company ID</p>
                <p className="font-medium">{formData.companyId || '—'}</p>
              </div>
            </div>

            {/* Commodity */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Commodity Details</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Commodity</p>
                  <p className="font-medium">{formData.commodity || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Route</p>
                  <p className="font-medium">
                    {formData.fromLocation || '?'} → {formData.toLocation || '?'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                  <p className="font-medium">
                    {formData.weight || '0'} {formData.weightType || 'kg'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rate</p>
                  <p className="font-medium">₹{safeFixed(formData.rate)}</p>
                </div>
              </div>
            </div>

            {/* Truck */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Truck Details</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Truck No</p>
                  <p className="font-medium">{formData.truckNo || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Driver</p>
                  <p className="font-medium">
                    {formData.driverName || 'N/A'}
                    {formData.driverPhone && ` (${formData.driverPhone})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transporter</p>
                  <p className="font-medium">
                    {formData.transporterName || 'N/A'}
                    {formData.transporterPhone && ` (${formData.transporterPhone})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Truck Weight</p>
                  <p className="font-medium">
                    {formData.truckWeight || '0'} {formData.truckWeightType || 'kg'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Truck Rate</p>
                  <p className="font-medium">₹{safeFixed(formData.truckRate)}</p>
                </div>

                {/* Commission Type & Amount */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Commission Type</p>
                  <p className="font-medium capitalize">{commissionTypeLabel()}</p>
                </div>
                {(formData.commissionAmount || formData.truckCommissionAmount) && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Commission Amount
                    </p>
                    <p className="font-medium">
                      ₹{safeFixed(isTruckCommission ? formData.truckCommissionAmount : formData.commissionAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Financial Summary */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 text-white">
          <h3 className="text-xl font-semibold">Financial Summary</h3>
        </div>
        <div className="p-6">
          {/* Party Account */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-300">Party Account</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Party Freight:</span>
                <span className="font-medium">₹{safeFixed(partyFreight)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Advance Received:</span>
                <span>-₹{safeFixed(initialPaymentFromParty)}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold">
                <span>Balance Receivable:</span>
                <span className="text-blue-700 dark:text-blue-300">₹{safeFixed(partyReceivable)}</span>
              </div>

              <div className="mt-2">
                {getStatusBadge(partyReceivable)}
              </div>
            </div>
          </div>

          {/* Truck Account */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 text-emerald-800 dark:text-emerald-300">Truck Account</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Truck Freight:</span>
                <span className="font-medium">₹{safeFixed(truckFreight)}</span>
              </div>

              {isTruckCommission && commissionAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Commission Deducted:</span>
                  <span>-₹{safeFixed(commissionAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Advance Paid:</span>
                <span>-₹{safeFixed(initialPaymentToTruck)}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold">
                <span>Balance Payable:</span>
                <span className="text-emerald-700 dark:text-emerald-300">₹{safeFixed(truckPayable)}</span>
              </div>

              <div className="mt-2">
                {getStatusBadge(truckPayable)}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {(formData.commissionRemark || formData.diffRemark) && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-gray-500 dark:text-gray-400">Remarks</h4>
              {formData.commissionRemark && (
                <div className="mb-4">
                  <p className="font-medium text-gray-500 dark:text-gray-400">Commission:</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.commissionRemark}</p>
                </div>
              )}
              {formData.diffRemark && (
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400">Difference:</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.diffRemark}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          {(formData.commissionGivenDate || formData.differenceGivenDate) && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Payment Details</h4>

              {formData.commissionGivenDate && (
                <div className="mb-6">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Commission Payment</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Date:</p>
                      <p>{formatDate(formData.commissionGivenDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Mode:</p>
                      <p className="capitalize">{formData.commissionPaymentMode || 'Not specified'}</p>
                    </div>
                    {formData.commissionPaymentMode === 'bank' && (
                      <>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Account No:</p>
                          <p>{formData.commissionBankAccountNo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">UTR/Ref:</p>
                          <p>{formData.commissionUtrNo || '—'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {formData.differenceGivenDate && (
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Difference Payment</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Date:</p>
                      <p>{formatDate(formData.differenceGivenDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Mode:</p>
                      <p className="capitalize">{formData.differencePaymentMode || 'Not specified'}</p>
                    </div>
                    {formData.differencePaymentMode === 'bank' && (
                      <>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Account No:</p>
                          <p>{formData.differenceBankAccountNo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">UTR/Ref:</p>
                          <p>{formData.differenceUtrNo || '—'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3ReviewAndSubmit;