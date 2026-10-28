/* Dorothy's Books: owner invitation UI. Uses existing app login and API helpers. */
(function () {
  let inviteToken = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
  if (inviteToken) history.replaceState(null, '', location.pathname + location.search);
  let teamCache = null;
  let inviteLink = '';

  const oldRenderAuth = renderAuth;
  renderAuth = function () {
    if (!inviteToken) return oldRenderAuth();
    root.innerHTML = [
      '<div class="auth-bg"><div class="auth-story"><div class="brand" style="padding:0">',
      '<span class="brand-mark">D</span><div><b>Dorothy’s Books</b><small>Finance, in focus</small></div></div>',
      '<div class="eyebrow">PRIVATE OWNER INVITATION</div><h1>Your books.<br><em>Your login.</em></h1>',
      '<p>Use your own email and password. You will have access to the same Dorothy’s Petcare records as the administrator.</p>',
      '</div><div class="auth-right"><form id="acceptInviteForm" class="auth-form">',
      '<div class="overline">INVITATION · ONE-TIME LINK</div><h2>Create your account.</h2>',
      '<p>Enter the exact email address the invitation was sent to. No owner setup code is needed.</p>',
      '<label class="form-label">YOUR INVITED EMAIL<input class="field" type="email" name="email" autocomplete="username" required></label>',
      '<label class="form-label">NEW PASSWORD<input class="field" type="password" name="password" minlength="10" autocomplete="new-password" required></label>',
      '<button class="btn primary" style="width:100%;padding:14px" type="submit">Accept invitation and sign in</button>',
      '<p class="smallprint">This invitation expires after 7 days and works only once.</p>',
      '<div id="invitationMessage" role="alert"></div></form></div></div>'
    ].join('');
  };

  const oldRender = render;
  render = function () {
    oldRender();
    if (section === 'settings' && books && boot?.user) renderTeamPanel();
  };

  function renderTeamPanel() {
    const main = document.querySelector('main.content');
    if (!main || document.getElementById('dbTeamPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'dbTeamPanel';
    panel.className = 'panel';
    panel.style.marginBottom = '22px';
    const isAdmin = books.company.access_role === 'admin';
    const members = teamCache && teamCache.members
      ? teamCache.members.map(m => '<div class="data-row"><span>' + esc(m.email) + '</span><strong>' + esc(m.role === 'admin' ? 'Administrator' : 'Business owner') + '</strong></div>').join('')
      : '<p class="smallprint">Team members will appear here after loading.</p>';
    const pending = teamCache && teamCache.invites && teamCache.invites.length
      ? '<div class="panel-sub" style="margin-top:14px">PENDING INVITATIONS</div>' +
        teamCache.invites.map(i => '<div class="data-row"><span>' + esc(i.email) + '</span><span class="status neutral">Pending</span></div>').join('')
      : '';
    panel.innerHTML = [
      '<div class="panel-head"><div><div class="panel-title">People & access</div>',
      '<div class="panel-sub">Each person signs in independently. No shared passwords.</div></div></div>',
      '<div class="panel-body">', members, pending,
      '<div class="two-actions" style="margin-top:16px"><button type="button" id="dbLoadTeam" class="btn">Refresh team</button></div>',
      isAdmin ? '<form id="dbInviteForm" style="margin-top:19px"><label class="form-label">INVITE DARIUS BY EMAIL<input class="field" type="email" name="email" placeholder="Darius’s email address" autocomplete="email" required></label><button class="btn primary" style="margin-top:12px" type="submit">Create private invitation</button></form>' : '',
      '<div id="dbInviteOutput" style="margin-top:14px" role="status"></div>',
      '<p class="smallprint">Invitation links are valid for 7 days and can be used once. Share privately with the intended person.</p>',
      '</div>'
    ].join('');
    main.insertBefore(panel, main.firstChild);
    if (!teamCache) loadTeam();
    if (inviteLink) showInviteLink();
  }

  async function loadTeam() {
    try {
      teamCache = await api('team');
      if (section === 'settings') render();
    } catch (e) { notify(e.message, true); }
  }

  function showInviteLink() {
    const output = document.getElementById('dbInviteOutput');
    if (!output || !inviteLink) return;
    output.innerHTML = '<div class="panel-sub">PRIVATE INVITATION — SEND DIRECTLY TO DARIUS</div>' +
      '<input class="field" id="dbInviteLink" readonly aria-label="Invitation URL" value="' + esc(inviteLink) + '" style="margin:10px 0;max-width:100%">' +
      '<button type="button" id="dbCopyInvite" class="btn primary">Copy invitation link</button>' +
      '<p class="smallprint">This invitation is not emailed automatically. Copy it and send it privately.</p>';
  }

  document.addEventListener('submit', async function (event) {
    if (event.target.id === 'acceptInviteForm') {
      event.preventDefault(); event.stopImmediatePropagation();
      const form = event.target;
      const button = form.querySelector('button[type=submit]');
      button.disabled = true;
      try {
        const d = Object.fromEntries(new FormData(form).entries());
        await api('auth/invite/accept', {token: inviteToken, email: d.email, password: d.password});
        inviteToken = '';
        companyId = 0;
        await rebootstrap();
        notify('Your separate owner account is ready.');
      } catch (e) {
        document.getElementById('invitationMessage').textContent = e.message;
        button.disabled = false;
      }
      return;
    }
    if (event.target.id === 'dbInviteForm') {
      event.preventDefault(); event.stopImmediatePropagation();
      const form = event.target;
      const button = form.querySelector('button[type=submit]');
      button.disabled = true;
      try {
        const email = new FormData(form).get('email');
        const result = await api('team/invite', { email });
        inviteLink = location.origin + '/#invite=' + encodeURIComponent(result.invite_token);
        teamCache = await api('team');
        render();
        showInviteLink();
        notify('Private owner invitation created. Copy and send it to Darius.');
      } catch (e) { notify(e.message, true); button.disabled = false; }
    }
  }, true);

  document.addEventListener('click', async function (event) {
    if (event.target.id === 'dbLoadTeam') {
      await loadTeam();
      return;
    }
    if (event.target.id === 'dbCopyInvite') {
      try { await navigator.clipboard.writeText(inviteLink); notify('Invitation link copied.'); }
      catch { const el=document.getElementById('dbInviteLink'); if(el){el.select();notify('Select and copy the link manually.');} }
    }
  }, true);
})();
