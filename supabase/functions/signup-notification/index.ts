import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface TenantPayload {
  type: 'INSERT'
  table: 'tenants'
  record: {
    id: string
    name: string
    slug: string
    owner_id: string
    created_at: string
  }
  schema: 'public'
}

serve(async (req) => {
  // CORS ayarları
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const payload = await req.json()
    console.log('Tetikleyici alındı:', JSON.stringify(payload, null, 2))

    // Sadece INSERT işlemlerini dinle
    if (payload.type === 'INSERT' && payload.table === 'tenants') {
      const record = payload.record
      
      // Kullanıcı detaylarını çekmek için Supabase service role ile sorgu atabiliriz
      // Veya payload içinde gelmediyse metadata'dan almak için auth.users veya profiles'tan veri çekeriz
      // Bu örnekte, yeni kaydolan tenant sahibinin profilini veya auth.users kaydını alacağız:
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

      let ownerName = 'Bilinmiyor'
      let ownerEmail = 'Bilinmiyor'
      let ownerPhone = 'Bilinmiyor'

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${record.owner_id}&select=*`, {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            }
          })
          const profiles = await profileRes.json()
          if (profiles && profiles.length > 0) {
            ownerName = profiles[0].full_name || ownerName
            ownerPhone = profiles[0].phone || ownerPhone
          }

          // Auth tablosundan e-postayı çekmek için admin API'sini taklit edebiliriz
          // Ancak profiles tablosuna e-posta eklemek veya auth.users tablosuna doğrudan erişmek gerekebilir.
          // Basitlik ve güvenlik açısından e-postayı doğrudan profiles tablosuna da kaydedebiliriz veya metadata'da tutabiliriz.
          // Burada handle_new_user tetikleyicimizde profile tablosuna email kolonu eklemediysek,
          // auth kullanıcısını API ile sorgulayalım:
          const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${record.owner_id}`, {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            }
          })
          const authUser = await authRes.json()
          if (authUser) {
            ownerEmail = authUser.email || ownerEmail
            if (authUser.user_metadata) {
              ownerName = authUser.user_metadata.full_name || ownerName
              ownerPhone = authUser.user_metadata.phone || ownerPhone
            }
          }
        } catch (dbErr) {
          console.error('Kullanıcı bilgileri çekilirken hata oluştu:', dbErr)
        }
      }

      const emailSubject = `Yeni Üyelik Bildirimi: ${record.name}`
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ECE4D2; border-radius: 12px; background-color: #FBF8F0;">
          <h2 style="color: #E85C46; border-bottom: 2px solid #E85C46; padding-bottom: 10px; margin-top: 0;">Yeni İşletme Kaydı!</h2>
          <p>Sisteme yeni bir üyelik kaydı yapıldı. Detaylar aşağıdadır:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB; width: 35%;">İşletme Adı:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">${record.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB;">Yetkili Kişi:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">${ownerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB;">Telefon:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">${ownerPhone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB;">E-posta:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">${ownerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB;">Slug Linki:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">
                <a href="https://${record.slug}.isteyonetim.com" style="color: #E85C46; font-weight: bold; text-decoration: none;">
                  ${record.slug}.isteyonetim.com
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #E7DECB;">Kayıt Tarihi:</td>
              <td style="padding: 8px; border-bottom: 1px solid #E7DECB;">${new Date(record.created_at).toLocaleString('tr-TR')}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6A7686;">
            Bu e-posta İşteYönetim SaaS Altyapısı tarafından otomatik gönderilmiştir.
          </div>
        </div>
      `

      // Resend API üzerinden e-postayı gönder
      if (RESEND_API_KEY) {
        console.log('E-posta gönderiliyor...')
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Isteyonetim Altyapi <system@isteyonetim.com>',
            to: ['admin@isteyonetim.com'],
            subject: emailSubject,
            html: emailHtml,
          })
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Resend API Hatası: ${errText}`)
        }
        
        console.log('E-posta başarıyla gönderildi.')
      } else {
        console.log('RESEND_API_KEY tanımlanmadığı için e-posta gönderimi pas geçildi (simüle edildi).')
        console.log('Mail İçeriği:\n', emailHtml)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })
  } catch (err) {
    console.error('Hata oluştu:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    })
  }
})
