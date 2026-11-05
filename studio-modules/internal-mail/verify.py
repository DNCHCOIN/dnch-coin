import secrets, json, time, urllib.request, urllib.error
class Response:
 def __init__(self,r): self.status_code=r.status; self.text=r.read().decode()
 def json(self): return json.loads(self.text)
class requests:
 @staticmethod
 def post(url,headers,json,timeout):
  req=urllib.request.Request(url,data=__import__('json').dumps(json).encode(),headers=headers,method='POST')
  try: return Response(urllib.request.urlopen(req,timeout=timeout))
  except urllib.error.HTTPError as e: return Response(e)
 @staticmethod
 def get(url,headers,timeout):
  try: return Response(urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=timeout))
  except urllib.error.HTTPError as e: return Response(e)
from pathlib import Path
API='https://wthzcqgzcbkvhovtcmoe.supabase.co/functions/v1/studio-mail'
KEY='sb_publishable_G4Rf57u-Ty4ZIFxLS7H2lg_OY99dVKb'
users=[]
def call(action,data={},token=None,expected=200):
 h={'apikey':KEY,'Content-Type':'application/json','Origin':'https://dnchcoin.github.io'}
 if token:h['Authorization']='Bearer '+token
 r=requests.post(API,headers=h,json={'action':action,**data},timeout=50)
 if r.status_code!=expected:raise Exception(f'{action}: expected {expected}, got {r.status_code}: {r.text[:300]}')
 return r.json()
suffix=secrets.token_hex(4)
for n in range(3):
 u={'username':f'qatest{suffix}{n}','password':secrets.token_urlsafe(24),'display_name':'Temporary QA member'}
 r=call('register',u);u.update(r);users.append(u)
 Path('/tmp/dnch-studio-qa.json').write_text(json.dumps(users))
assert all(u.get('session') and u.get('recovery_code') for u in users)
print('PASS registration without external email, three separate accounts')
a,b,c=users
ta,tb,tc=[u['session']['access_token'] for u in users]
assert call('me',token=ta)['member']['address']==a['username']+'@dnch'
call('login',{'username':a['username'],'password':'invalid-password-value'},expected=401)
print('PASS username sign-in and invalid-password rejection')
import uuid
payload={'recipient':b['username']+'@dnch','subject':'QA delivery <script>','body':'Private test message <img src=x onerror=alert(1)>','request_id':str(uuid.uuid4())}
msg=call('send',payload,ta)['id']
assert call('send',payload,ta)['id']==msg
assert any(m['id']==msg for m in call('list',{'folder':'inbox'},tb)['items'])
assert any(m['id']==msg for m in call('list',{'folder':'sent'},ta)['items'])
assert not call('list',{'folder':'inbox'},tc)['items']
call('read',{'id':msg,'folder':'inbox'},tc,404)
call('delete',{'id':msg,'folder':'sent'},tc,404)
call('read',{'id':msg,'folder':'inbox'},tb)
assert call('list',{'folder':'inbox'},tb)['unread']==0
print('PASS delivery, sent mailbox, idempotent retry, read state, third-user isolation')
call('send',{**payload,'recipient':'unknown@external.example','request_id':str(uuid.uuid4())},ta,400)
call('send',{**payload,'recipient':'nonexistentqa123','request_id':str(uuid.uuid4())},ta,404)
draft=call('save-draft',{'recipient':b['username'],'subject':'Draft','body':'Saved'},ta)['id']
assert call('list',{'folder':'drafts'},ta)['items'][0]['id']==draft
call('save-draft',{'id':draft,'recipient':'','subject':'Changed','body':'stolen'},tc,404)
call('delete',{'id':msg,'folder':'inbox'},tb)
assert not call('list',{'folder':'inbox'},tb)['items']
assert call('list',{'folder':'sent'},ta)['items']
print('PASS internal-only recipients, private drafts and independent message deletion')
newpass=secrets.token_urlsafe(24)
r=call('recover',{'username':b['username'],'password':newpass,'recovery_code':b['recovery_code']})
assert r['recovery_code']!=b['recovery_code']
call('me',token=tb,expected=401)
call('recover',{'username':b['username'],'password':newpass,'recovery_code':b['recovery_code']},expected=401)
call('login',{'username':b['username'],'password':newpass})
print('PASS recovery code rotation, single use and invalidation of old sessions')
call('me',expected=401)
for table in ['studio_members','studio_messages','studio_drafts','studio_rate_limits']:
 r=requests.get('https://wthzcqgzcbkvhovtcmoe.supabase.co/rest/v1/'+table,headers={'apikey':KEY},timeout=30)
 assert r.status_code in (401,403), (table,r.status_code)
print('PASS unauthenticated API and direct-table access blocked')
r=call('refresh',{'refresh_token':a['session']['refresh_token']})
assert r['session']['access_token']
call('logout',token=r['session']['access_token'])
print('PASS session refresh and sign-out')
print('ALL BACKEND CHECKS PASSED')
