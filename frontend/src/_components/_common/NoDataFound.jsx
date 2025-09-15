import { T } from "@/_utils/LanguageTranslator"

const NoDataFound = () => {
  return (
    <div className='no-data-container'>
      <div className='no-data'>
        {"🤔  " + T["no_data_found"]}
      </div>
    </div>
  )
}

export default NoDataFound
