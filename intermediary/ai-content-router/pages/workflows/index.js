import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from 'next/head';
import JWT from "jsonwebtoken";

export async function getServerSideProps(context) {
  const secret = process.env.EMBED_WORKFLOW_SK;
  const publishableKey = process.env.NEXT_PUBLIC_EMBED_WORKFLOW_PK;
  const version = process.env.NEXT_PUBLIC_EMBED_WORKFLOW_UI_VERSION || '1.5.0';
  const userId = process.env.EMBED_WORKFLOW_DEFAULT_USER || 'main';
  
  if (!secret || !publishableKey) {
    return {
      props: {
        error: 'Missing environment variables. Please check your .env.local file.',
        token: null,
        embedWorkflowPk: null,
        ewfVersion: version,
        userId
      },
    };
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: currentTime,
    exp: currentTime + 60 * 60,
    discover: true,
  };
  const token = JWT.sign(payload, secret, { algorithm: "HS256" });

  const userPayload = JSON.stringify({
    email: `${userId}@example.com`,
    data: {
      contentPreferences: {
        blogPosts: true,
        teamUpdates: true,
        meetingInvites: true,
        alerts: true
      }
    }
  });

  const requestOptions = {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: userPayload,
  };

  try {
    await fetch(`https://embedworkflow.com/api/v1/users/${userId}`, requestOptions);
  } catch (error) {
  }

  return {
    props: {
      token,
      embedWorkflowPk: publishableKey,
      ewfVersion: version,
      userId
    },
  };
}

const WorkflowsPage = (props) => {
  const { token, ewfVersion, embedWorkflowPk, userId, error } = props;
  const router = useRouter();
  
  const loadWorkflows = () => window.EWF.load(embedWorkflowPk, { 
    jwt: token,
    onError: (error) => {
    }
  });

  useEffect(() => {
    if (error || !token || !embedWorkflowPk) {
      return;
    }
    
    
    const script = document.createElement("script");
    script.src = `https://cdn.ewf.to/ewf-${ewfVersion}.js`;
    
    script.onload = () => {
      loadWorkflows();
    };
    
    script.onerror = (error) => {
    };

    document.body.appendChild(script);

    return () => {
      try {
        if (script && script.parentNode === document.body) {
          document.body.removeChild(script);
        }
      } catch (error) {
      }
    };
  }, [error, token, embedWorkflowPk]);

  const goBack = () => {
    router.push('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Required</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Back to Content Router
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Workflows for {userId} | Content Router</title>
        <meta name="description" content="Manage your content generation workflows" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light text-gray-900">
            Content Generation Workflows for User: <span className="font-medium">{userId}</span>
          </h1>
          <button
            onClick={goBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Content Router
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-full" style={{height: "calc(100vh - 150px)"}}>
            <link
              rel="stylesheet"
              media="screen"
              href={`https://cdn.ewf.to/ewf-${ewfVersion}.css`}
            />
            <div
              className="EWF__app"
              data-base-path="workflows"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;