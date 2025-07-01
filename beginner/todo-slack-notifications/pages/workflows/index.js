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
    sub: userId, // user's unique identifier from ENV
    iat: currentTime,
    exp: currentTime + 60 * 60,
    discover: true, // auto discover users
  };
  const token = JWT.sign(payload, secret, { algorithm: "HS256" });

  // Optional: Update user data
  const userPayload = JSON.stringify({
    email: `${userId}@example.com`, // Example email
    data: {
      // Sample data for demo purposes
      notificationPreferences: {
        taskCreated: true,
        taskCompleted: true
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
    console.log("error updating user:", error);
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
  const [loadError, setLoadError] = useState(!!error);
  const [errorMessage, setErrorMessage] = useState(error || '');
  
  const loadWorkflows = () => window.EWF.load(embedWorkflowPk, { 
    jwt: token,
    onError: (error) => {
      console.error("EWF Error:", error);
      setLoadError(true);
      setErrorMessage(error.message || 'Failed to load workflows');
    }
  });

  useEffect(() => {
    // Don't load if we have an error or missing credentials
    if (error || !token || !embedWorkflowPk) {
      console.log("Skipping EWF load due to missing credentials or error:", { error, hasToken: !!token, hasPK: !!embedWorkflowPk });
      return;
    }
    
    console.log("Loading Embed Workflow UI with:", {
      token: token ? "JWT token present" : "No token",
      version: ewfVersion,
      userId,
      embedWorkflowPk: embedWorkflowPk ? "PK present" : "No PK",
    });
    
    const script = document.createElement("script");
    script.src = `https://cdn.ewf.to/ewf-${ewfVersion}.js`;
    
    script.onload = () => {
      console.log("EWF script loaded successfully");
      loadWorkflows();
    };
    
    script.onerror = (error) => {
      console.error("Error loading EWF script:", error);
      setLoadError(true);
      setErrorMessage("Failed to load Embed Workflow script");
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [error, token, embedWorkflowPk]);

  const goBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F2' }}>
      <Head>
        <title>Workflows for {userId} | Todo App</title>
        <meta name="description" content="Manage your automation workflows" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light text-gray-900">
            Workflows for User: <span className="font-medium">{userId}</span>
          </h1>
          <button
            onClick={goBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Tasks
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-full" style={{height: "calc(100vh - 150px)"}}>
            <link
              rel="stylesheet"
              media="screen"
              href={`https://cdn.ewf.to/ewf-${ewfVersion}.css`}
            />
            {loadError ? (
              <div className="p-8 text-center">
                <div className="text-red-500 text-lg mb-4">Failed to load workflow UI</div>
                <p className="text-gray-600 mb-6">{errorMessage || "There was an error loading the Embed Workflow interface. Please try again later."}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 mr-4"
                >
                  Retry
                </button>
                <button
                  onClick={goBack}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Tasks
                </button>
              </div>
            ) : (
              <div
                className="EWF__app"
                data-base-path="workflows"
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;