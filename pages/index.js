'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
 
const SEGMENTOS = [
  'Saúde & Estética','Alimentação','Moda & Varejo',
  'Advocacia & Jurídico','Arquitetura & Design',
  'Educação','Imobiliária','Tecnologia','Outro'
]
 
const AVATAR_COLORS = [
  { bg:'#E6F1FB', text:'#185FA5' },
  { bg:'#E1F5EE', text:'#0F6E56' },
  { bg:'#FAECE7', text:'#993C1D' },
  { bg:'#FAEEDA', text:'#854F0B' },
  { bg:'#FBEAF0', text:'#993556' },
]
 
const FORMATOS = [
  { id:'feed',    label:'Feed',    sub:'1080 × 1080',  w:1080, h:1080, icon:'⬛' },
  { id:'story',   label:'Stories', sub:'1080 × 1920',  w:1080, h:1920, icon:'▬'  },
  { id:'retrato', label:'Retrato', sub:'1080 × 1350',  w:1080, h:1350, icon:'🖼'  },
]
 
const DESIGN_PROMPTS = [
  'Post de promoção especial com destaque no desconto',
  'Card de depoimento de cliente satisfeito',
  'Destaque do serviço ou produto principal',
  'Banner institucional com os diferenciais',
  'Dica ou conteúdo educativo do segmento',
  'Lançamento de produto ou serviço novo',
  'Post de data comemorativa da área',
  'Apresentação da equipe / bastidores',
]
 
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
 
export default function Home() {
  const [tab, setTab] = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedSegs, setSelectedSegs] = useState([])
  const [form, setForm] = useState({ nome:'', site:'', instagram:'', cidade:'', sobre:'' })
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [apiKeyStored, setApiKeyStored] = useState(false)
  const [designClient, setDesignClient] = useState(null)
  const [designPrompt, setDesignPrompt] = useState('')
  const [formato, setFormato] = useState('feed')
  const [generating, setGenerating] = useState(false)
  const [generatedSVG, setGeneratedSVG] = useState(null)
  const [designError, setDesignError] = useState(null)
 
  useEffect(() => {
    fetchClientes()
    const stored = localStorage.getItem('anthropic_api_key')
    if (stored) { setApiKey(stored); setApiKeyStored(true) }
  }, [])
 
  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }
 
  function saveApiKey() {
    localStorage.setItem('anthropic_api_key', apiKey)
    setApiKeyStored(true)
  }
 
  async function callClaude(messages, system, maxTokens) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 1000,
        system: system || undefined,
        messages
      })
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.content?.[0]?.text || ''
  }
 
  async function analyzeClient() {
    if (!form.site && !form.instagram) { alert('Informe pelo menos o site ou o Instagram.'); return }
    if (!apiKey) { alert('Configure sua chave de API na aba "API".'); return }
    setAnalyzing(true)
    setAnalysisResult(null)
    try {
      const text = await callClaude([{ role:'user', content: `Você é um especialista sênior em branding, identidade visual e design. Analise esta empresa e crie um perfil visual completo.
 
DADOS DA EMPRESA:
- Nome: ${form.nome || 'não informado'}
- Site: ${form.site || 'não informado'}
- Instagram: ${form.instagram || 'não informado'}
- Segmento: ${selectedSegs.join(', ') || 'não informado'}
- Cidade: ${form.cidade || 'não informado'}
- Descrição: ${form.sobre || 'não informado'}
 
Com base no segmento, nome, site e Instagram, deduza a identidade visual provável desta empresa com profundidade. Pense como um diretor de arte sênior.
 
Responda APENAS com JSON puro, sem markdown:
 
{
  "paleta": {
    "primaria": "#hex",
    "secundaria": "#hex",
    "acento": "#hex",
    "fundo": "#hex",
    "texto": "#hex"
  },
  "tipografia": {
    "display": "fonte exata para títulos (Google Fonts)",
    "corpo": "fonte exata para texto corrido",
    "estilo": "descrição do estilo tipográfico em 1 frase"
  },
  "tom": "tom de voz em 1 frase curta",
  "personalidade": ["adjetivo1", "adjetivo2", "adjetivo3"],
  "estetica": "descrição da estética visual em 2 frases",
  "instrucoes_design": "instruções detalhadas para o designer: composição, elementos gráficos, o que usar, o que evitar, efeitos visuais recomendados para posts de Instagram"
}` }], null, 1200)
 
      const clean = text.replace(/```json|```/g, '').trim()
      setAnalysisResult(JSON.parse(clean))
    } catch(e) {
      alert('Erro na análise: ' + e.message)
    }
    setAnalyzing(false)
  }
 
  async function saveCliente() {
    if (!form.nome.trim()) { alert('Informe o nome da empresa!'); return }
    setSaving(true)
    const { error } = await supabase.from('clientes').insert([{
      ...form,
      segmento: selectedSegs.join(', '),
      perfil_visual: analysisResult ? JSON.stringify(analysisResult) : null
    }])
    setSaving(false)
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setForm({ nome:'', site:'', instagram:'', cidade:'', sobre:'' })
    setSelectedSegs([])
    setAnalysisResult(null)
    fetchClientes()
    setTab('clientes')
  }
 
  async function generateDesign(client, prompt) {
    if (!apiKey) { alert('Configure sua chave de API na aba "API".'); return }
    setGenerating(true)
    setGeneratedSVG(null)
    setDesignError(null)
 
    const fmt = FORMATOS.find(f => f.id === formato) || FORMATOS[0]
    let pv = null
    try { pv = client.perfil_visual ? JSON.parse(client.perfil_visual) : null } catch(e) {}
 
    const system = `Você é um designer gráfico profissional de altíssimo nível, especializado em criar posts para Instagram como SVG.
 
REGRAS ABSOLUTAS:
1. Responda APENAS com código SVG puro — começa com <svg e termina com </svg>
2. O viewBox DEVE ser exatamente: "0 0 ${fmt.w} ${fmt.h}"
3. Use apenas elementos SVG: rect, circle, text, path, line, polygon, ellipse, g, defs, linearGradient, radialGradient, pattern, clipPath, style
4. Para Google Fonts: <defs><style>@import url('https://fonts.googleapis.com/css2?family=Nome:wght@400;700&display=swap');</style></defs>
5. PROIBIDO: tag <image> com src externo
6. Design COMPLETO, profissional e visualmente rico — não um esboço
7. Use gradientes, formas geométricas, tipografia bem hierarquizada
8. Composição adequada para o formato ${fmt.label} (${fmt.w}×${fmt.h}px)
9. Textos legíveis com hierarquia clara: título grande, subtítulo médio, detalhes pequenos`
 
    const perfilTexto = pv ? `
IDENTIDADE VISUAL DA MARCA (siga rigorosamente):
- Cor primária: ${pv.paleta?.primaria}
- Cor secundária: ${pv.paleta?.secundaria}
- Cor acento: ${pv.paleta?.acento}
- Cor fundo: ${pv.paleta?.fundo}
- Cor texto: ${pv.paleta?.texto}
- Fonte títulos: ${pv.tipografia?.display}
- Fonte corpo: ${pv.tipografia?.corpo}
- Tom de voz: ${pv.tom}
- Personalidade: ${pv.personalidade?.join(', ')}
- Estética: ${pv.estetica}
- Instruções do diretor de arte: ${pv.instrucoes_design}
` : `
- Segmento: ${client.segmento || ''}
- Cidade: ${client.cidade || ''}
- Sobre: ${client.sobre || ''}
`
 
    const userMsg = `Crie um ${fmt.label} de Instagram SVG ${fmt.w}×${fmt.h}px para: ${client.nome}
 
${perfilTexto}
PEDIDO: ${prompt}
 
Instagram: ${client.instagram || ''}
Site: ${client.site || ''}
 
Formato: ${fmt.label} (${fmt.w}×${fmt.h}px) — adapte a composição para esse formato.
${fmt.id === 'story' ? 'É um STORY vertical — use o espaço vertical com seções bem distribuídas, elemento hero grande no topo, texto no centro, call-to-action na base.' : ''}
${fmt.id === 'feed' ? 'É um POST de FEED quadrado — composição centralizada e balanceada.' : ''}
${fmt.id === 'retrato' ? 'É um POST RETRATO 4:5 — aproveite a altura extra com uma composição elegante em camadas.' : ''}
 
Apenas o SVG completo.`
 
    try {
      const text = await callClaude([{ role:'user', content: userMsg }], system, 4000)
      const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i)
      if (svgMatch) {
        setGeneratedSVG(svgMatch[0])
      } else {
        setDesignError('Não foi possível gerar o SVG. Tente reformular o prompt.')
      }
    } catch(e) {
      setDesignError('Erro: ' + e.message)
    }
    setGenerating(false)
  }
 
  function downloadSVG() {
    if (!generatedSVG) return
    const blob = new Blob([generatedSVG], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${designClient?.nome || 'design'}-${formato}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }
 
  function toggleSeg(seg) {
    setSelectedSegs(prev => prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg])
  }
 
  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.segmento || '').toLowerCase().includes(search.toLowerCase())
  )
 
  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'0.5px solid #d4d2ca', fontSize:14, background:'#fafaf8', boxSizing:'border-box', fontFamily:'inherit' }
  const btnPrimary = { padding:'9px 20px', borderRadius:8, border:'none', background:'#1a1a1a', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer' }
  const btnSecondary = { padding:'9px 20px', borderRadius:8, border:'0.5px solid #d4d2ca', background:'transparent', fontSize:14, cursor:'pointer', color:'#6b6a65' }
  const btnGold = { padding:'9px 20px', borderRadius:8, border:'none', background:'#B8922A', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }
  const card = { background:'#fff', border:'0.5px solid #e5e3dc', borderRadius:12, padding:'1.5rem' }
  const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }
 
  function NavBtn({ id, label }) {
    const active = tab === id
    return (
      <button onClick={() => setTab(id)} style={{
        padding:'6px 14px', borderRadius:8, border:'0.5px solid',
        borderColor: active ? '#1a1a1a' : '#d4d2ca',
        background: active ? '#1a1a1a' : 'transparent',
        color: active ? '#fff' : '#6b6a65',
        fontSize:13, cursor:'pointer', fontWeight: active ? 500 : 400
      }}>{label}</button>
    )
  }
 
  // Preview dimensions scaled down
  const fmt = FORMATOS.find(f => f.id === formato) || FORMATOS[0]
  const previewMaxW = 480
  const previewMaxH = 560
  const scaleW = previewMaxW / fmt.w
  const scaleH = previewMaxH / fmt.h
  const scale = Math.min(scaleW, scaleH)
  const previewW = fmt.w * scale
  const previewH = fmt.h * scale
 
  return (
    <div style={{ minHeight:'100vh', background:'#f8f7f4', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
 
      <div style={{ background:'#fff', borderBottom:'0.5px solid #e5e3dc', padding:'0 2rem' }}>
        <div style={{ maxWidth:980, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, background:'#1a1a1a', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>S</span>
            </div>
            <span style={{ fontWeight:600, fontSize:15, color:'#1a1a1a' }}>Estúdio de Design</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <NavBtn id="clientes" label="Clientes" />
            <NavBtn id="cadastrar" label="+ Novo cliente" />
            <NavBtn id="config" label="⚙ API" />
          </div>
        </div>
      </div>
 
      <div style={{ maxWidth:980, margin:'0 auto', padding:'2rem' }}>
 
        {/* CONFIG */}
        {tab === 'config' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:600, color:'#1a1a1a', margin:'0 0 4px' }}>Configuração</h1>
            <p style={{ fontSize:13, color:'#888', margin:'0 0 1.5rem' }}>Sua chave fica salva apenas no seu navegador</p>
            <div style={card}>
              <label style={lbl}>Anthropic API Key</label>
              <div style={{ display:'flex', gap:10 }}>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." style={{ ...inp, flex:1 }} />
                <button onClick={saveApiKey} style={btnPrimary}>Salvar</button>
              </div>
              {apiKeyStored && <p style={{ fontSize:13, color:'#0F6E56', marginTop:10 }}>✓ Chave salva neste navegador</p>}
              <p style={{ fontSize:12, color:'#aaa', marginTop:12, lineHeight:1.6 }}>
                Usada para analisar clientes e gerar designs. Nunca enviada para nossos servidores.
              </p>
            </div>
          </div>
        )}
 
        {/* CLIENTES */}
        {tab === 'clientes' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <div>
                <h1 style={{ fontSize:20, fontWeight:600, color:'#1a1a1a', margin:0 }}>Clientes</h1>
                <p style={{ fontSize:13, color:'#888', margin:'4px 0 0' }}>{clientes.length} na base compartilhada</p>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...inp, width:200 }} />
            </div>
 
            {loading ? (
              <div style={{ textAlign:'center', padding:'4rem', color:'#888' }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'4rem', color:'#888' }}>
                <p style={{ fontSize:32, margin:'0 0 12px' }}>🏢</p>
                <p style={{ fontSize:14 }}>Nenhum cliente ainda.</p>
                <button onClick={() => setTab('cadastrar')} style={{ marginTop:16, ...btnPrimary }}>Cadastrar cliente</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filtered.map((c, i) => {
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  const temPerfil = !!c.perfil_visual
                  let pv = null
                  try { pv = temPerfil ? JSON.parse(c.perfil_visual) : null } catch(e) {}
                  return (
                    <div key={c.id} style={{ ...card, padding:'1rem 1.25rem' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:42, height:42, borderRadius:'50%', background:color.bg, color:color.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, flexShrink:0 }}>
                            {getInitials(c.nome)}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <p style={{ fontWeight:600, fontSize:14, color:'#1a1a1a', margin:0 }}>{c.nome}</p>
                              {temPerfil
                                ? <span style={{ fontSize:11, background:'#E1F5EE', color:'#0F6E56', padding:'2px 8px', borderRadius:20, fontWeight:500 }}>perfil visual ✓</span>
                                : <span style={{ fontSize:11, background:'#f0f0ec', color:'#888', padding:'2px 8px', borderRadius:20 }}>sem perfil</span>
                              }
                            </div>
                            <p style={{ fontSize:12, color:'#888', margin:'3px 0 0' }}>{[c.segmento, c.cidade].filter(Boolean).join(' · ') || 'Sem segmento'}</p>
                            {pv && (
                              <div style={{ display:'flex', gap:4, marginTop:5 }}>
                                {Object.values(pv.paleta || {}).map((v, idx) => (
                                  <div key={idx} title={v} style={{ width:14, height:14, borderRadius:3, background:v, border:'0.5px solid rgba(0,0,0,0.1)' }} />
                                ))}
                                <span style={{ fontSize:11, color:'#aaa', marginLeft:4 }}>{pv.tipografia?.display}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => { setDesignClient(c); setDesignPrompt(''); setGeneratedSVG(null); setDesignError(null); setFormato('feed'); setTab('gerar') }}
                          style={{ ...btnGold, fontSize:12, padding:'7px 16px' }}>
                          Gerar design ✦
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
 
        {/* CADASTRAR */}
        {tab === 'cadastrar' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:600, color:'#1a1a1a', margin:'0 0 4px' }}>Novo cliente</h1>
            <p style={{ fontSize:13, color:'#888', margin:'0 0 1.5rem' }}>Preencha e deixe a IA criar o perfil visual automaticamente</p>
            <div style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Nome da empresa *</label>
                  <input value={form.nome} onChange={e => setForm(p => ({...p, nome:e.target.value}))} placeholder="Ex: Clínica Bella Pele" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Cidade / Estado</label>
                  <input value={form.cidade} onChange={e => setForm(p => ({...p, cidade:e.target.value}))} placeholder="Ex: Goiânia, GO" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Site</label>
                  <input value={form.site} onChange={e => setForm(p => ({...p, site:e.target.value}))} placeholder="https://empresa.com.br" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Instagram</label>
                  <input value={form.instagram} onChange={e => setForm(p => ({...p, instagram:e.target.value}))} placeholder="@nomedaempresa" style={inp} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Segmento</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {SEGMENTOS.map(seg => (
                      <button key={seg} onClick={() => toggleSeg(seg)} style={{
                        padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', border:'0.5px solid',
                        borderColor: selectedSegs.includes(seg) ? 'transparent' : '#d4d2ca',
                        background: selectedSegs.includes(seg) ? '#E6F1FB' : 'transparent',
                        color: selectedSegs.includes(seg) ? '#185FA5' : '#6b6a65',
                        fontWeight: selectedSegs.includes(seg) ? 500 : 400
                      }}>{seg}</button>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Sobre a empresa</label>
                  <textarea value={form.sobre} onChange={e => setForm(p => ({...p, sobre:e.target.value}))} placeholder="Descreva o que a empresa faz, público-alvo, diferenciais, tom de voz..." rows={4} style={{ ...inp, resize:'vertical' }} />
                </div>
              </div>
 
              {/* ANÁLISE IA */}
              <div style={{ marginTop:'1.5rem', background:'#fafaf8', border:'0.5px solid #e5e3dc', borderRadius:10, padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14, color:'#1a1a1a', margin:0 }}>✦ Análise de identidade visual com IA</p>
                    <p style={{ fontSize:12, color:'#888', margin:'4px 0 0' }}>Define paleta, tipografia, tom e estilo da marca automaticamente</p>
                  </div>
                  <button onClick={analyzeClient} disabled={analyzing} style={{ ...btnGold, marginLeft:16, flexShrink:0, opacity: analyzing ? 0.7 : 1 }}>
                    {analyzing ? 'Analisando...' : 'Analisar marca'}
                  </button>
                </div>
 
                {analyzing && <div style={{ textAlign:'center', padding:'1.5rem', color:'#888', fontSize:13 }}>Estudando a identidade visual da marca...</div>}
 
                {analysisResult && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <div style={{ background:'#fff', border:'0.5px solid #e5e3dc', borderRadius:8, padding:'0.75rem' }}>
                        <p style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 10px' }}>Paleta de cores</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {Object.entries(analysisResult.paleta || {}).map(([k, v]) => (
                            <div key={k} style={{ textAlign:'center' }}>
                              <div style={{ width:36, height:36, borderRadius:6, background:v, border:'0.5px solid rgba(0,0,0,0.1)', marginBottom:4 }} />
                              <p style={{ fontSize:10, color:'#aaa', margin:0 }}>{k}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background:'#fff', border:'0.5px solid #e5e3dc', borderRadius:8, padding:'0.75rem' }}>
                        <p style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Tipografia</p>
                        <p style={{ fontSize:13, color:'#1a1a1a', margin:'0 0 4px' }}>Título: <strong>{analysisResult.tipografia?.display}</strong></p>
                        <p style={{ fontSize:13, color:'#1a1a1a', margin:'0 0 6px' }}>Corpo: <strong>{analysisResult.tipografia?.corpo}</strong></p>
                        <p style={{ fontSize:12, color:'#888', margin:0, fontStyle:'italic' }}>{analysisResult.tipografia?.estilo}</p>
                      </div>
                    </div>
                    <div style={{ background:'#fff', border:'0.5px solid #e5e3dc', borderRadius:8, padding:'0.75rem', marginBottom:10 }}>
                      <p style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px' }}>Tom & Personalidade</p>
                      <p style={{ fontSize:13, color:'#1a1a1a', margin:'0 0 8px' }}>{analysisResult.tom}</p>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {(analysisResult.personalidade || []).map(p => (
                          <span key={p} style={{ fontSize:12, background:'#f0f0ec', color:'#555', padding:'3px 10px', borderRadius:20 }}>{p}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'#fff', border:'0.5px solid #e5e3dc', borderRadius:8, padding:'0.75rem' }}>
                      <p style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px' }}>Estética visual</p>
                      <p style={{ fontSize:13, color:'#1a1a1a', margin:0, lineHeight:1.6 }}>{analysisResult.estetica}</p>
                    </div>
                    <p style={{ fontSize:12, color:'#0F6E56', marginTop:10, fontWeight:500 }}>✓ Perfil visual será salvo com o cliente</p>
                  </div>
                )}
              </div>
 
              {success && <div style={{ marginTop:14, background:'#E1F5EE', color:'#0F6E56', border:'0.5px solid #5DCAA5', borderRadius:8, padding:'10px 14px', fontSize:13 }}>✓ Cliente salvo!</div>}
 
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:'1.25rem' }}>
                <button onClick={() => { setForm({nome:'',site:'',instagram:'',cidade:'',sobre:''}); setSelectedSegs([]); setAnalysisResult(null) }} style={btnSecondary}>Limpar</button>
                <button onClick={saveCliente} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? 'Salvando...' : 'Salvar cliente'}</button>
              </div>
            </div>
          </div>
        )}
 
        {/* GERAR DESIGN */}
        {tab === 'gerar' && designClient && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
              <button onClick={() => setTab('clientes')} style={{ ...btnSecondary, padding:'6px 12px', fontSize:13 }}>← Voltar</button>
              <div>
                <h1 style={{ fontSize:20, fontWeight:600, color:'#1a1a1a', margin:0 }}>Design — {designClient.nome}</h1>
                <p style={{ fontSize:13, color:'#888', margin:'4px 0 0' }}>{[designClient.segmento, designClient.cidade].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
 
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
 
              {/* COLUNA ESQUERDA: controles */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
 
                {/* Formato */}
                <div style={card}>
                  <label style={lbl}>Formato</label>
                  <div style={{ display:'flex', gap:10 }}>
                    {FORMATOS.map(f => (
                      <button key={f.id} onClick={() => { setFormato(f.id); setGeneratedSVG(null) }} style={{
                        flex:1, padding:'12px 8px', borderRadius:8, border:'0.5px solid', cursor:'pointer',
                        borderColor: formato === f.id ? '#B8922A' : '#d4d2ca',
                        background: formato === f.id ? '#FEF9EE' : 'transparent',
                        color: formato === f.id ? '#B8922A' : '#6b6a65',
                        fontWeight: formato === f.id ? 600 : 400,
                        textAlign:'center'
                      }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>
                          {f.id === 'feed' && (
                            <svg width="24" height="24" viewBox="0 0 24 24" style={{ display:'block', margin:'0 auto' }}>
                              <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                          {f.id === 'story' && (
                            <svg width="16" height="24" viewBox="0 0 16 24" style={{ display:'block', margin:'0 auto' }}>
                              <rect x="1" y="1" width="14" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                          {f.id === 'retrato' && (
                            <svg width="20" height="24" viewBox="0 0 20 24" style={{ display:'block', margin:'0 auto' }}>
                              <rect x="1" y="1" width="18" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ fontSize:13 }}>{f.label}</div>
                        <div style={{ fontSize:11, opacity:0.7 }}>{f.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
 
                {/* Sugestões */}
                <div style={card}>
                  <label style={lbl}>Sugestões</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {DESIGN_PROMPTS.map(p => (
                      <button key={p} onClick={() => setDesignPrompt(p)} style={{
                        padding:'8px 12px', borderRadius:8, fontSize:13, cursor:'pointer', border:'0.5px solid', textAlign:'left',
                        borderColor: designPrompt === p ? '#1a1a1a' : '#e5e3dc',
                        background: designPrompt === p ? '#1a1a1a' : '#fafaf8',
                        color: designPrompt === p ? '#fff' : '#555',
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
 
                {/* Prompt */}
                <div style={card}>
                  <label style={lbl}>Seu prompt</label>
                  <textarea
                    value={designPrompt}
                    onChange={e => setDesignPrompt(e.target.value)}
                    placeholder={`Descreva o design para ${designClient.nome}...\nEx: Post de promoção de fim de ano com 20% de desconto, fundo escuro, tom elegante e urgente.`}
                    rows={5}
                    style={{ ...inp, resize:'vertical' }}
                  />
                  <button
                    onClick={() => generateDesign(designClient, designPrompt)}
                    disabled={generating || !designPrompt.trim()}
                    style={{ ...btnGold, width:'100%', marginTop:12, opacity: (generating || !designPrompt.trim()) ? 0.6 : 1, fontSize:15, padding:'12px' }}
                  >
                    {generating ? 'Gerando design...' : '✦ Gerar design'}
                  </button>
                </div>
              </div>
 
              {/* COLUNA DIREITA: preview */}
              <div>
                <div style={{ ...card, minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  {!generatedSVG && !generating && !designError && (
                    <div style={{ textAlign:'center', color:'#aaa' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
                      <p style={{ fontSize:14, color:'#888' }}>O design aparecerá aqui</p>
                      <p style={{ fontSize:12, color:'#aaa', marginTop:4 }}>Escolha o formato, escreva o prompt e clique em gerar</p>
                    </div>
                  )}
 
                  {generating && (
                    <div style={{ textAlign:'center', color:'#888' }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>✦</div>
                      <p style={{ fontSize:14, fontWeight:500 }}>Criando design com IA...</p>
                      <p style={{ fontSize:12, color:'#aaa', marginTop:6 }}>Pode levar alguns segundos</p>
                    </div>
                  )}
 
                  {designError && (
                    <div style={{ background:'#FCEBEB', color:'#A32D2D', border:'0.5px solid #F09595', borderRadius:8, padding:'12px 16px', fontSize:13, width:'100%' }}>
                      {designError}
                    </div>
                  )}
 
                  {generatedSVG && (
                    <div style={{ width:'100%' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                        <p style={{ fontWeight:600, fontSize:14, color:'#1a1a1a', margin:0 }}>
                          {fmt.label} · {fmt.w}×{fmt.h}
                        </p>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => generateDesign(designClient, designPrompt)} style={{ ...btnSecondary, fontSize:12, padding:'5px 12px' }}>Regerar</button>
                          <button onClick={downloadSVG} style={{ ...btnPrimary, fontSize:12, padding:'5px 12px' }}>Baixar SVG</button>
                        </div>
                      </div>
                      <div style={{ background:'#e8e8e4', borderRadius:8, padding:16, display:'flex', justifyContent:'center', alignItems:'center' }}>
                        <div style={{
                          width: previewW,
                          height: previewH,
                          borderRadius:6,
                          overflow:'hidden',
                          boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
                          flexShrink:0
                        }}
                          dangerouslySetInnerHTML={{ __html: generatedSVG.replace(
                            /viewBox="0 0 \d+ \d+"/,
                            `viewBox="0 0 ${fmt.w} ${fmt.h}" width="${previewW}" height="${previewH}"`
                          )}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
 
      </div>
    </div>
  )
}
