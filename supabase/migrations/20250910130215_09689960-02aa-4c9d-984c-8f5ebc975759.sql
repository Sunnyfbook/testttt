-- Update the INSERT policy for video_reactions to properly validate IP address
DROP POLICY IF EXISTS "Users can insert video reactions" ON public.video_reactions;

CREATE POLICY "Users can insert video reactions" 
ON public.video_reactions 
FOR INSERT 
WITH CHECK (
  ip_address = (( 
    SELECT ips.ip
    FROM ( 
      SELECT unnest(string_to_array(
        COALESCE(
          split_part(((current_setting('request.headers'::text, true))::json ->> 'x-forwarded-for'::text), ','::text, 1), 
          ((current_setting('request.headers'::text, true))::json ->> 'cf-connecting-ip'::text), 
          ((current_setting('request.headers'::text, true))::json ->> 'x-real-ip'::text), 
          '127.0.0.1'::text
        ), ','::text
      )) AS ip
    ) ips
    WHERE (TRIM(BOTH FROM ips.ip) <> ''::text)
    LIMIT 1
  ))::inet
);