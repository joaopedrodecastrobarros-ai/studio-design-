'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'Saúde & Estética', 'Alimentação', 'Moda & Varejo',
  'Advocacia & Jurídico', 'Arquitetura & Design',
  'Educação', 'Imobiliária', 'Tecnologia', 'Outro'
]

const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#FBEAF0', text: '#993556' },
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
  const [form, setForm] = useState({
    nome: '', site: '', instagram: '', cidade: '',
    cores: '', fontes: '', sobre: ''
  })
  const [viewClient, setViewClient] = useState(null)

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  async function saveCliente() {
    if (!form.nome.trim()) { alert('Informe o nome da empresa!'); return }
    setSaving(true)
    const { error } = await supabase.from('clientes').insert([{
      ...form,
      segmento: selectedSegs.join(', ')
    }])
    setSaving(false)
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setForm({ nome: '', site: '', instagram: '', cidade: '', cores: '', fontes: '', sobre: '' })
    setSelectedSegs([])
    fetchClientes()
    setTab('clientes')
  }

  async function deleteCliente(id) {
    if (!confirm('Remover este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    fetchClientes()
  }

  function toggleSeg(seg) {
    setSelectedSegs(prev => prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg])
  }

  function buildPrompt(c) {
    let p = `Crie um design para o cliente **${c.nome}**.\n\n`
    if (c.segmento) p += `Segmento: ${c.segmento}\n`
    if (c.cores) p += `Cores da marca: ${c.cores}\n`
    if (c.fontes) p += `Estilo visual: ${c.fontes}\n`
    if (c.site) p += `Site: ${c.site}\n`
    if (c.instagram) p += `Instagram: ${c.instagram}\n`
    if (c.cidade) p += `Cidade: ${c.cidade}\n`
    if (c.sobre) p += `\nSobre a empresa: ${c.sobre}\n`
    p += `\nCrie um post de Instagram profissional e bonito, fiel à identidade visual desta empresa.`
    navigator.clipboard.writeText(p).then(() => alert('Prompt copiado! Cole no Claude para gerar o design.'))
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.segmento || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e3dc', padding: '0 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>S</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>Estúdio de Design</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['clientes', 'cadastrar', 'como-usar'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 8, border: '0.5px solid',
                borderColor: tab === t ? '#1a1a1a' : '#d4d2ca',
                background: tab === t ? '#1a1a1a' : 'transparent',
                color: tab === t ? '#fff' : '#6b6a65',
                fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 500 : 400
              }}>
                {t === 'clientes' ? 'Clientes' : t === 'cadastrar' ? '+ Novo cliente' : 'Como usar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>

        {/* ABA CLIENTES */}
        {tab === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Clientes cadastrados</h1>
                <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} na base</p>
              </div>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #d4d2ca', fontSize: 13, width: 220, background: '#fff' }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>Carregando clientes...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                <p style={{ fontSize: 14 }}>Nenhum cliente ainda. Cadastre o primeiro!</p>
                <button onClick={() => setTab('cadastrar')} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '0.5px solid #1a1a1a', background: '#1a1a1a', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                  Cadastrar cliente
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((c, i) => {
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  return (
                    <div key={c.id} style={{ background: '#fff', border: '0.5px solid #e5e3dc', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: color.bg, color: color.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                          {getInitials(c.nome)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', margin: 0 }}>{c.nome}</p>
                          <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0' }}>{[c.segmento, c.cidade].filter(Boolean).join(' · ') || 'Sem segmento'}</p>
                          <p style={{ fontSize: 12, color: '#aaa', margin: '2px 0 0' }}>{[c.site, c.instagram].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => setViewClient(c)} style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #d4d2ca', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#1a1a1a' }}>Ver</button>
                        <button onClick={() => buildPrompt(c)} style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #1a1a1a', background: '#1a1a1a', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                          Gerar prompt ↗
                        </button>
                        <button onClick={() => deleteCliente(c.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #fca5a5', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                          Remover
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL VER CLIENTE */}
        {viewClient && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setViewClient(null)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{viewClient.nome}</h2>
                <button onClick={() => setViewClient(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
              </div>
              {[
                { label: 'Segmento', value: viewClient.segmento },
                { label: 'Site', value: viewClient.site },
                { label: 'Instagram', value: viewClient.instagram },
                { label: 'Cidade', value: viewClient.cidade },
                { label: 'Cores', value: viewClient.cores },
                { label: 'Estilo visual', value: viewClient.fontes },
                { label: 'Sobre', value: viewClient.sobre },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ fontSize: 14, color: '#1a1a1a', margin: 0, lineHeight: 1.5 }}>{f.value}</p>
                </div>
              ))}
              <button onClick={() => { buildPrompt(viewClient); setViewClient(null) }} style={{ marginTop: '1rem', width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Gerar prompt para este cliente ↗
              </button>
            </div>
          </div>
        )}

        {/* ABA CADASTRAR */}
        {tab === 'cadastrar' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Novo cliente</h1>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Preencha as informações para salvar na base do time</p>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #e5e3dc', borderRadius: 16, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { id: 'nome', label: 'Nome da empresa *', placeholder: 'Ex: Clínica Bella Pele', full: true },
                  { id: 'site', label: 'Site', placeholder: 'https://empresa.com.br' },
                  { id: 'instagram', label: 'Instagram', placeholder: '@nomedaempresa' },
                  { id: 'cidade', label: 'Cidade / Estado', placeholder: 'Ex: Goiânia, GO' },
                  { id: 'cores', label: 'Cores da marca', placeholder: 'Ex: azul marinho, dourado, branco', full: true },
                  { id: 'fontes', label: 'Estilo visual', placeholder: 'Ex: moderno e minimalista, vibrante e jovem...', full: true },
                ].map(f => (
                  <div key={f.id} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</label>
                    <input
                      value={form[f.id]}
                      onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d4d2ca', fontSize: 14, background: '#fafaf8', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Segmento</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SEGMENTOS.map(seg => (
                      <button key={seg} onClick={() => toggleSeg(seg)} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: '0.5px solid',
                        borderColor: selectedSegs.includes(seg) ? 'transparent' : '#d4d2ca',
                        background: selectedSegs.includes(seg) ? '#E6F1FB' : 'transparent',
                        color: selectedSegs.includes(seg) ? '#185FA5' : '#6b6a65',
                        fontWeight: selectedSegs.includes(seg) ? 500 : 400
                      }}>{seg}</button>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Sobre a empresa</label>
                  <textarea
                    value={form.sobre}
                    onChange={e => setForm(p => ({ ...p, sobre: e.target.value }))}
                    placeholder="Descreva o que a empresa faz, público-alvo, diferenciais, tom de voz..."
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d4d2ca', fontSize: 14, background: '#fafaf8', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {success && (
                <div style={{ marginTop: 14, background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #5DCAA5', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  ✓ Cliente salvo com sucesso! Redirecionando...
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: '1.25rem' }}>
                <button onClick={() => { setForm({ nome: '', site: '', instagram: '', cidade: '', cores: '', fontes: '', sobre: '' }); setSelectedSegs([]) }} style={{ padding: '9px 20px', borderRadius: 8, border: '0.5px solid #d4d2ca', background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#6b6a65' }}>
                  Limpar
                </button>
                <button onClick={saveCliente} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#888' : '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Salvar cliente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA COMO USAR */}
        {tab === 'como-usar' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Como usar o estúdio</h1>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Guia rápido para o time</p>
            </div>
            {[
              { n: '1', titulo: 'Cadastre o cliente', desc: 'Clique em "+ Novo cliente" e preencha site, Instagram, cores, segmento e descrição da empresa. Quanto mais info, melhor o design.' },
              { n: '2', titulo: 'Gere o prompt', desc: 'Na lista de clientes, clique em "Gerar prompt ↗". O sistema monta automaticamente todas as informações do cliente e copia para o seu clipboard.' },
              { n: '3', titulo: 'Cole no Claude', desc: 'Abra o Claude, cole o prompt copiado e peça o design que precisa. Pode adicionar prints do Instagram do cliente junto para referência visual.' },
              { n: '4', titulo: 'Personalize o pedido', desc: 'Adicione ao prompt o tipo de design: post de Instagram, banner, card de depoimento, stories, bio, paleta de cores, etc.' },
            ].map(step => (
              <div key={step.n} style={{ background: '#fff', border: '0.5px solid #e5e3dc', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{step.n}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', margin: 0 }}>{step.titulo}</p>
                  <p style={{ fontSize: 13, color: '#6b6a65', margin: '4px 0 0', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}

            <div style={{ background: '#f0f9ff', border: '0.5px solid #bae6fd', borderRadius: 12, padding: '1rem 1.25rem', marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', margin: '0 0 6px' }}>Exemplos de pedidos para o Claude</p>
              {[
                '"Crie um post de Instagram para o cliente [nome] anunciando promoção de verão"',
                '"Faça um card de depoimento com fundo escuro para [nome]"',
                '"Gere uma paleta de cores completa para [nome] baseada nas informações do cliente"',
                '"Crie uma bio otimizada do Instagram para [nome]"',
              ].map((ex, i) => (
                <p key={i} style={{ fontSize: 12, color: '#0c4a6e', margin: '4px 0', fontFamily: 'monospace', background: '#fff', padding: '4px 8px', borderRadius: 6 }}>{ex}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
