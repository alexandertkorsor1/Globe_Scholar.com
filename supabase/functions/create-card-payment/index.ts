import { withSupabase } from 'npm:@supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(
  withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      const body = await req.json();

      const {
        applicationId,
        amount,
        paymentType,
      } = body;

      if (!applicationId) {
        return new Response(
          JSON.stringify({ error: 'Application ID is required.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment amount.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (
        !['registration_fee', 'tuition_fee', 'admission_fee'].includes(
          paymentType
        )
      ) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment type.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      /*
       * IMPORTANT:
       * Never trust the browser for ownership.
       * Verify that the authenticated student owns this application.
       */

      const { data: application, error: applicationError } =
        await ctx.supabase
          .from('applications')
          .select('id, student_id, student_name, application_number')
          .eq('id', applicationId)
          .single();

      if (applicationError || !application) {
        return new Response(
          JSON.stringify({ error: 'Application not found.' }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (application.student_id !== ctx.userClaims?.sub) {
        return new Response(
          JSON.stringify({
            error: 'You are not authorized to pay for this application.',
          }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({
            error: 'Stripe has not been configured on the server.',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      /*
       * Stripe amount is expressed in the smallest currency unit.
       * USD $150.00 = 15000 cents.
       */

      const stripeAmount = Math.round(amount * 100);

      const stripeResponse = await fetch(
        'https://api.stripe.com/v1/payment_intents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: String(stripeAmount),
            currency: 'usd',
            'payment_method_types[]': 'card',

            'metadata[application_id]': application.id,
            'metadata[payment_type]': paymentType,
            'metadata[student_id]': ctx.userClaims?.sub ?? '',
            'metadata[application_number]':
              application.application_number ?? '',
          }),
        }
      );

      const paymentIntent = await stripeResponse.json();

      if (!stripeResponse.ok) {
        console.error('Stripe error:', paymentIntent);

        return new Response(
          JSON.stringify({
            error:
              paymentIntent?.error?.message ||
              'Unable to create Stripe payment.',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('create-card-payment error:', error);

      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to start card payment.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  })
);
