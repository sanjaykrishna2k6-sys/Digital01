import React, { useState } from 'react'
import { Sparkles, X, Send, CheckCircle, Lightbulb, Database, Calendar, AlertTriangle } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  'Why did organic clicks decline this month?',
  'Which Shopify products need attention or restocking?',
  'What are our top SEO recommendations for this client?',
  'Summarize overall client performance and deliverable status.',
]

export function AIAssistantModal({ isOpen, onClose, clientId = null }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSend = async (promptText) => {
    const queryText = promptText || question
    if (!queryText || !queryText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: queryText.trim(), clientId }),
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(json.message || 'Failed to get answer from AI Assistant.')
      }

      setAnswer(json.data?.answer)
    } catch (err) {
      setError(err.message || 'Error processing query.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Krishpo AI Marketing Assistant</h2>
              <p style={{ fontSize: 12, opacity: 0.85, margin: 0 }}>Grounded strictly in connected SEO & Shopify metrics</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Suggested prompts chips */}
          {!answer && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Analysis Prompts</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(prompt)
                      handleSend(prompt)
                    }}
                    style={{ textAlign: 'left', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', transition: 'all 0.15s' }}
                    className="hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div style={{ padding: 14, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #E0E7FF', borderTopColor: '#4F46E5', borderRadius: '50%' }} />
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Analyzing connected GSC, GA4, and Shopify metrics...</p>
            </div>
          )}

          {/* Answer Card */}
          {answer && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Data Freshness Metadata Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color="#4F46E5" />
                  <span><strong>Period:</strong> {answer.reportingPeriod}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={13} color="#16A34A" />
                  <span><strong>Sources:</strong> {answer.dataSources?.join(', ')}</span>
                </div>
              </div>

              {/* Verified Observations */}
              <div style={{ background: '#EEF2FF', border: '1px solid #E0E7FF', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <CheckCircle size={16} color="#4F46E5" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3730A3', margin: 0 }}>Empirical Observations</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#1E1B4B' }}>
                  {answer.observations?.map((obs, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>{obs}</li>
                  ))}
                </ul>
              </div>

              {/* Actionable Recommendations */}
              <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Lightbulb size={16} color="#16A34A" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532D', margin: 0 }}>Actionable Recommendations</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#064E3B' }}>
                  {answer.recommendations?.map((rec, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant about SEO clicks, Shopify sales, or task progress..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !question.trim()}
            style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: loading || !question.trim() ? 'not-allowed' : 'pointer', opacity: loading || !question.trim() ? 0.6 : 1 }}
          >
            <Send size={14} />
            Ask AI
          </button>
        </div>
      </div>
    </div>
  )
}
