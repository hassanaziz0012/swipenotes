import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { type Session } from '../db/models/session';
import { CardCountsByProject } from './CardCountsByProject';
import SessionDetails from './SessionDetails';

export interface ProjectCount {
    project: {
        id: number;
        name: string;
        color: string;
    };
    count: number;
}

interface SessionReviewProps {
    session: Session;
    projectCounts: ProjectCount[];
    containerStyle?: StyleProp<ViewStyle>;
}

export default function SessionReview({ session, projectCounts, containerStyle }: SessionReviewProps) {
    return (
        <View style={containerStyle}>
            <SessionDetails 
                session={session} 
                containerStyle={{ width: '100%', maxWidth: 400 }}
            />

            {projectCounts.length > 0 && (
                <CardCountsByProject
                    projectCounts={projectCounts}
                    title="Cards Studied by Project"
                    style={{ marginTop: 20, width: '100%', maxWidth: 400 }}
                />
            )}
        </View>
    );
}
