import React from 'react'

function AlertMessages() {
  return (
    <div className="font-[sans-serif] space-y-6">
    <div className="bg-green-100 text-green-800 p-4 rounded-lg" role="alert">
      <strong className="font-bold text-sm mr-4">Success!</strong>
      <span className="block text-sm sm:inline max-sm:mt-2">This is a success message that requires your attention.</span>
    </div>

    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg" role="alert">
      <strong className="font-bold text-sm mr-4">Warning!</strong>
      <span className="block text-sm sm:inline max-sm:mt-2">This is a warning message that requires your attention.</span>
    </div>

    <div className="bg-red-100 text-red-800 p-4 rounded-lg" role="alert">
      <strong className="font-bold text-sm mr-4">Error!</strong>
      <span className="block text-sm sm:inline max-sm:mt-2">This is a error message that requires your attention.</span>
    </div>

    <div className="bg-blue-100 text-blue-800 p-4 rounded-lg" role="alert">
      <strong className="font-bold text-sm mr-4">Info!</strong>
      <span className="block text-sm sm:inline max-sm:mt-2">This is a info message that requires your attention.</span>
    </div>
  </div>
  )
}

export default AlertMessages
