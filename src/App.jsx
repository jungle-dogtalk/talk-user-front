import { useState, useEffect } from 'react'
import './App.css'
import { apiCall } from '../src/utils/apiCall'  // TODO: 상대경로에서 절대경로로 바꾸기
import { API_LIST } from '../src/utils/apiList'

function App() {
  const [count, setCount] = useState(0)
  const [testData, setTestData] = useState([])
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchTestData()    
  }, [])

  const fetchTestData = async () => {
    setLoading(true)
      const response = await apiCall(API_LIST.TEST_MULTIPLE_DATA)
      if (response.status) {
        setTestData(response.data)
        setLoading(false)
      } else {
        alert('에러 발생')
        setLoading(false)
      }            
  }

  const fetchGreeting = async () => {
    if (!name) {
      alert('이름을 입력해주세요.')
      return
    }

    const parameters = {
      name: name,
    }
    
    const response = await apiCall(API_LIST.TEST_GREETING, parameters)
    if (response.status) {
      setGreeting(response.data);
    }
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
  }

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        오른쪽 버튼을 눌러보세요 &nbsp;
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <div>
        <h2>테스트 API 호출해보기</h2>
        {loading ? (
          <p>테스트 데이터를 가져오고 있습니다...</p>
        ) : testData.length > 0 ? (
          <div>
            {testData.map((item) => (
              <div key={item.id} style={{margin: '10px 0'}}>
                <span style={{marginRight: '10px'}}>ID: {item.id}</span>
                <span>이름: {item.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>데이터를 불러오지 못했습니다.</p>
        )}
        <button onClick={fetchTestData}>테스트 데이터 가져오기</button>
      </div>

      <br></br>

      <div>
        <h2>Greeting 테스트</h2>
        {greeting ? (
          <div style={{margin: '10px 0'}}>
            <span>환영합니다 {greeting.name}님!</span>
          </div>
        ) : (
          <div>
            <input 
              type="text" 
              placeholder="당신의 이름은?"
              value={name}
              onChange={handleNameChange}
            />              
          </div>
        )}
        <button onClick={fetchGreeting}>서버로 나의 이름 전송하기</button>
      </div>

    </>
  )
}

export default App