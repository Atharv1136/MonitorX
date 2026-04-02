-- Fix help_requests update policy: only host of the session can resolve
DROP POLICY "Help requests can be updated" ON public.help_requests;
CREATE POLICY "Host can resolve help requests" ON public.help_requests FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = help_requests.session_id AND s.host_id = auth.uid()
  ));

-- Fix messages insert: also restrict viewing to session participants
DROP POLICY "Messages viewable by session members" ON public.messages;
CREATE POLICY "Messages viewable by session members" ON public.messages FOR SELECT TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid() OR to_user_id IS NULL
  );

-- Fix session_participants SELECT
DROP POLICY "Session participants viewable by session members" ON public.session_participants;
CREATE POLICY "Session participants viewable by session members" ON public.session_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.sessions s WHERE s.id = session_participants.session_id AND s.host_id = auth.uid()
    )
  );

-- Fix help_requests SELECT
DROP POLICY "Help requests viewable by session members" ON public.help_requests;
CREATE POLICY "Help requests viewable by session members" ON public.help_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.sessions s WHERE s.id = help_requests.session_id AND s.host_id = auth.uid()
    )
  );