import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../config/supabase'
import '../App.css'

function SupabaseConnectionTest() {
  const [status, setStatus] = useState('Проверка подключения...')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setStatus('Подключение к Supabase...')
      setError(null)
      
      const supabase = getSupabaseClient()
      
      // Простой тест подключения - попытка выполнить запрос к базе данных
      // Если таблиц еще нет, это нормально - мы просто проверяем, что можем подключиться
      const { data, error: queryError } = await supabase
        .from('rolleg_tournaments')
        .select('count')
        .limit(1)
      
      // Если ошибка связана с отсутствием таблицы - это нормально, значит подключение работает
      if (queryError) {
        if (queryError.code === 'PGRST116' || queryError.message.includes('relation') || queryError.message.includes('does not exist')) {
          // Таблица не существует - это нормально для первого подключения
          setStatus('✅ Подключение успешно!')
          setIsConnected(true)
          setTestResult({
            success: true,
            message: 'Подключение к Supabase работает. Таблицы еще не созданы - это нормально.',
            errorCode: queryError.code,
            errorMessage: queryError.message
          })
          return
        } else if (queryError.code === '42501' || queryError.message.includes('permission') || queryError.message.includes('RLS')) {
          // Проблема с правами доступа (RLS)
          setStatus('⚠️ Подключение работает, но есть проблема с правами доступа')
          setIsConnected(true)
          setTestResult({
            success: true,
            warning: true,
            message: 'Подключение работает, но нужно настроить Row Level Security (RLS) политики для публичного доступа.',
            errorCode: queryError.code,
            errorMessage: queryError.message
          })
          return
        } else {
          // Другая ошибка
          throw queryError
        }
      }
      
      // Если запрос прошел успешно
      setStatus('✅ Подключение успешно!')
      setIsConnected(true)
      setTestResult({
        success: true,
        message: 'Подключение к Supabase работает отлично!',
        data: data
      })
      
    } catch (err) {
      console.error('Ошибка подключения к Supabase:', err)
      setStatus('❌ Ошибка подключения')
      setIsConnected(false)
      setError({
        message: err.message || 'Неизвестная ошибка',
        code: err.code || 'UNKNOWN',
        details: err
      })
      setTestResult({
        success: false,
        message: 'Не удалось подключиться к Supabase',
        error: err
      })
    }
  }

  return (
    <div className="supabase-test-container" style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Тест подключения к Supabase</h1>
      
      <div style={{ 
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: isConnected ? '#d4edda' : error ? '#f8d7da' : '#fff3cd',
        border: `2px solid ${isConnected ? '#28a745' : error ? '#dc3545' : '#ffc107'}`,
        borderRadius: '8px'
      }}>
        <h2 style={{ marginTop: 0 }}>{status}</h2>
        
        {testResult && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Результат:</strong> {testResult.message}</p>
            
            {testResult.errorCode && (
              <div style={{ marginTop: '1rem', fontSize: '0.9em' }}>
                <p><strong>Код ошибки:</strong> {testResult.errorCode}</p>
                {testResult.errorMessage && (
                  <p><strong>Сообщение:</strong> {testResult.errorMessage}</p>
                )}
              </div>
            )}
            
            {testResult.warning && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px'
              }}>
                <p><strong>⚠️ Важно:</strong> Нужно настроить RLS политики в Supabase Dashboard для публичного доступа к таблицам.</p>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Ошибка:</strong> {error.message}</p>
            <p><strong>Код:</strong> {error.code}</p>
            <details style={{ marginTop: '1rem' }}>
              <summary>Детали ошибки</summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.85em'
              }}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Информация о подключении:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>URL:</strong> https://yekzgaaamijtnekkoxrr.supabase.co
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>Ключ:</strong> sb_publishable_TxQpmOg2Z74CQmP3X4f0Dw_THu35xlc
          </li>
        </ul>
      </div>
      
      <button 
        onClick={testConnection}
        className="btn-primary"
        style={{ 
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Повторить проверку
      </button>
    </div>
  )
}

export default SupabaseConnectionTest
